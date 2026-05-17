using System.Security.Claims;
using System.Text.Json;
using InvenTU.Core.Entities;
using InvenTU.Core.Enums;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace InvenTU.Infrastructure.Data.Interceptors;

public sealed class AuditSaveChangesInterceptor(IHttpContextAccessor httpContextAccessor) : SaveChangesInterceptor
{
    private static readonly HashSet<string> AuditedTypes =
    [
        nameof(Product),
        nameof(Warehouse),
        nameof(StockLocation),
        nameof(User),
        nameof(Category),
        nameof(StockMovement),
        nameof(StockItem),
        nameof(Supplier),
        nameof(PurchaseOrder),
        nameof(PurchaseOrderLine),
    ];

    // Surfaced entity-type name for IdentityUserRole<Guid> — its CLR name carries a `1 suffix,
    // and storing "UserRole" gives admins a readable filter value.
    private const string UserRoleEntityType = "UserRole";

    private static readonly IReadOnlyDictionary<string, HashSet<string>> SensitiveFields =
        new Dictionary<string, HashSet<string>>(StringComparer.Ordinal)
        {
            [nameof(User)] = new HashSet<string>(StringComparer.Ordinal)
            {
                "PasswordHash",
                "SecurityStamp",
                "ConcurrencyStamp",
                "NormalizedUserName",
                "NormalizedEmail",
                "AccessFailedCount",
                "LockoutEnd",
                "LockoutEnabled",
                "TwoFactorEnabled",
                "EmailConfirmed",
                "PhoneNumberConfirmed",
            },
            [nameof(StockItem)] = new HashSet<string>(StringComparer.Ordinal)
            {
                "RowVersion",
            },
        };

    private const string DeletedAtProperty = "DeletedAt";

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(eventData);
        CaptureAuditEntries(eventData.Context);
        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    public override InterceptionResult<int> SavingChanges(
        DbContextEventData eventData,
        InterceptionResult<int> result)
    {
        ArgumentNullException.ThrowIfNull(eventData);
        CaptureAuditEntries(eventData.Context);
        return base.SavingChanges(eventData, result);
    }

    private void CaptureAuditEntries(DbContext? context)
    {
        if (context is null)
        {
            return;
        }

        context.ChangeTracker.DetectChanges();

        var entries = context.ChangeTracker.Entries()
            .Where(e => GetAuditedEntityType(e.Entity) is not null)
            .Where(e => e.State is EntityState.Added or EntityState.Modified or EntityState.Deleted)
            .ToList();

        if (entries.Count == 0)
        {
            return;
        }

        var rawUserId = httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
        var userId = Guid.TryParse(rawUserId, out var parsedId) ? parsedId : (Guid?)null;
        var now = DateTime.UtcNow;
        var auditEntries = new List<AuditLog>(entries.Count);

        foreach (var entry in entries)
        {
            var auditLog = BuildAuditLog(entry, userId, now);
            if (auditLog is not null)
            {
                auditEntries.Add(auditLog);
            }
        }

        if (auditEntries.Count > 0)
        {
            context.Set<AuditLog>().AddRange(auditEntries);
        }
    }

    private static AuditLog? BuildAuditLog(EntityEntry entry, Guid? userId, DateTime now)
    {
        var entityType = GetAuditedEntityType(entry.Entity);
        if (entityType is null)
        {
            return null;
        }

        var action = ResolveAction(entry);

        var entityId = ResolveEntityId(entry);
        if (entityId is null)
        {
            return null;
        }

        var changedFields = BuildChangedFieldsJson(entry, entityType, action);

        return new AuditLog
        {
            Id = Guid.NewGuid(),
            EntityType = entityType,
            EntityId = entityId.Value,
            Action = action,
            ChangedFields = changedFields,
            UserId = userId,
            Timestamp = now,
        };
    }

    private static string? GetAuditedEntityType(object entity)
    {
        if (entity is IdentityUserRole<Guid>)
        {
            return UserRoleEntityType;
        }

        var name = entity.GetType().Name;
        return AuditedTypes.Contains(name) ? name : null;
    }

    private static Guid? ResolveEntityId(EntityEntry entry)
    {
        // IdentityUserRole has composite PK (UserId, RoleId). Use UserId as the user-facing
        // identifier so admins can correlate role-grant entries with the affected User row.
        if (entry.Entity is IdentityUserRole<Guid> ur)
        {
            return ur.UserId;
        }

        var idProp = entry.Properties.FirstOrDefault(p => p.Metadata.Name == "Id");
        return idProp?.CurrentValue as Guid?;
    }

    private static AuditAction ResolveAction(EntityEntry entry)
    {
        if (entry.State == EntityState.Added)
        {
            return AuditAction.Insert;
        }

        if (entry.State == EntityState.Deleted)
        {
            return AuditAction.Delete;
        }

        var deletedAt = entry.Properties.FirstOrDefault(p => p.Metadata.Name == DeletedAtProperty);
        if (deletedAt is not null && deletedAt.OriginalValue is null && deletedAt.CurrentValue is not null)
        {
            return AuditAction.Delete;
        }

        return AuditAction.Update;
    }

    private static string BuildChangedFieldsJson(EntityEntry entry, string entityType, AuditAction action)
    {
        var before = new Dictionary<string, object?>(StringComparer.Ordinal);
        var after = new Dictionary<string, object?>(StringComparer.Ordinal);
        var sensitive = SensitiveFields.GetValueOrDefault(entityType);

        foreach (var prop in entry.Properties)
        {
            if (prop.Metadata.IsShadowProperty())
            {
                continue;
            }

            var name = prop.Metadata.Name;
            if (sensitive is not null && sensitive.Contains(name))
            {
                continue;
            }

            switch (action)
            {
                case AuditAction.Insert:
                    after[name] = prop.CurrentValue;
                    break;
                case AuditAction.Delete:
                    before[name] = prop.OriginalValue;
                    break;
                case AuditAction.Update:
                    before[name] = prop.OriginalValue;
                    after[name] = prop.CurrentValue;
                    break;
            }
        }

        var payload = new Dictionary<string, object?>(StringComparer.Ordinal);
        if (before.Count > 0)
        {
            payload["before"] = before;
        }

        if (after.Count > 0)
        {
            payload["after"] = after;
        }

        return JsonSerializer.Serialize(payload);
    }
}
