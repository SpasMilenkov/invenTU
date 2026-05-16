using InvenTU.Core.Contracts.Repositories;
using InvenTU.Core.Contracts.Services;
using InvenTU.Core.DTOs.AuditLogs;
using InvenTU.Core.DTOs.Common;

namespace InvenTU.Application.AuditLogs;

public sealed class AuditLogService(IAuditLogRepository auditLogRepository) : IAuditLogService
{
    private static readonly HashSet<string> AllowedEntityTypes =
        new(StringComparer.OrdinalIgnoreCase)
        {
            "Product",
            "Warehouse",
            "StockLocation",
            "User",
            "Category",
            "StockMovement",
            "StockItem",
            "Supplier",
            "PurchaseOrder",
            "PurchaseOrderLine",
            "UserRole",
        };

    public Task<PagedResult<AuditLogDto>> GetPagedAsync(AuditLogQueryParams query, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(query);

        var normalized = new AuditLogQueryParams
        {
            EntityType = NormalizeEntityType(query.EntityType),
            Action = query.Action,
            UserId = query.UserId,
            FromDate = query.FromDate,
            ToDate = query.ToDate,
            Page = Math.Max(1, query.Page),
            PageSize = Math.Clamp(query.PageSize, 1, 200),
        };

        return auditLogRepository.GetPagedAsync(normalized, cancellationToken);
    }

    private static string? NormalizeEntityType(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return null;
        }

        var trimmed = raw.Trim();
        var match = AllowedEntityTypes.FirstOrDefault(
            allowed => string.Equals(allowed, trimmed, StringComparison.OrdinalIgnoreCase));
        return match;
    }
}
