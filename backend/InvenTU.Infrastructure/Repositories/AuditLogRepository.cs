using System.Text.Json;
using InvenTU.Core.Contracts.Repositories;
using InvenTU.Core.DTOs.AuditLogs;
using InvenTU.Core.DTOs.Common;
using InvenTU.Core.Entities;
using InvenTU.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InvenTU.Infrastructure.Repositories;

public sealed class AuditLogRepository(InvenTUDbContext dbContext) : IAuditLogRepository
{
    private static readonly JsonDocumentOptions JsonOptions = new()
    {
        AllowTrailingCommas = true,
    };

    public async Task<PagedResult<AuditLogDto>> GetPagedAsync(AuditLogQueryParams query, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(query);

        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, 200);

        IQueryable<AuditLog> source = dbContext.Set<AuditLog>().AsNoTracking();

        if (!string.IsNullOrWhiteSpace(query.EntityType))
        {
            var et = query.EntityType.Trim();
            source = source.Where(a => a.EntityType == et);
        }

        if (query.Action is { } action)
        {
            source = source.Where(a => a.Action == action);
        }

        if (query.UserId is { } userId)
        {
            source = source.Where(a => a.UserId == userId);
        }

        if (query.FromDate is { } fromDate)
        {
            var from = DateTime.SpecifyKind(fromDate, DateTimeKind.Utc);
            source = source.Where(a => a.Timestamp >= from);
        }

        if (query.ToDate is { } toDate)
        {
            var to = DateTime.SpecifyKind(toDate, DateTimeKind.Utc);
            source = source.Where(a => a.Timestamp <= to);
        }

        var totalCount = await source.CountAsync(cancellationToken);

        var rows = await source
            .OrderByDescending(a => a.Timestamp)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new
            {
                a.Id,
                a.EntityType,
                a.EntityId,
                a.Action,
                a.ChangedFields,
                a.UserId,
                a.Timestamp,
                UserDisplayName = a.User != null ? (a.User.FirstName + " " + a.User.LastName) : null,
            })
            .ToListAsync(cancellationToken);

        var items = rows.Select(r => new AuditLogDto
        {
            Id = r.Id,
            EntityType = r.EntityType,
            EntityId = r.EntityId,
            Action = r.Action.ToString(),
            ChangedFields = ParseJson(r.ChangedFields),
            UserId = r.UserId,
            UserDisplayName = r.UserDisplayName,
            Timestamp = DateTime.SpecifyKind(r.Timestamp, DateTimeKind.Utc),
        }).ToList();

        return PagedResult<AuditLogDto>.Create(items, totalCount, page, pageSize);
    }

    private static JsonElement ParseJson(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            using var empty = JsonDocument.Parse("{}");
            return empty.RootElement.Clone();
        }

        using var doc = JsonDocument.Parse(raw, JsonOptions);
        return doc.RootElement.Clone();
    }
}
