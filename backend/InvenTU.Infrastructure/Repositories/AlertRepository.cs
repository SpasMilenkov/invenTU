using InvenTU.Core.Contracts.Repositories;
using InvenTU.Core.DTOs.Alerts;
using InvenTU.Core.Entities;
using InvenTU.Core.Enums;
using InvenTU.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InvenTU.Infrastructure.Repositories;

public sealed class AlertRepository(InvenTUDbContext dbContext) : IAlertRepository
{
    public async Task<Alert?> UnresolvedAlertForProductAsync(Guid productId, AlertType alertType, CancellationToken cancellationToken = default)
    {
        return await dbContext.Alerts
            .FirstOrDefaultAsync(a => a.ProductId == productId
                    && a.AlertType == alertType
                    && a.ResolvedAt == null,
                    cancellationToken);
    }

    public async Task<Guid> CreateAsync(Alert alert, CancellationToken cancellationToken = default)
    {
        dbContext.Alerts.Add(alert);
        await dbContext.SaveChangesAsync(cancellationToken);
        return alert.Id;
    }

    public async Task CreateUserStatesAsync(
        Guid alertId,
        IEnumerable<Guid> userIds,
        CancellationToken cancellationToken = default)
    {
        var states = userIds.Select(uid => new AlertUserState
        {
            AlertId = alertId,
            UserId = uid,
            IsRead = false,
            SnoozedUntil = null,
        });

        dbContext.AlertUserStates.AddRange(states);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task ResolveAsync(Guid alertId, CancellationToken cancellationToken = default)
    {
        var alertToResolve = await dbContext.Alerts.FirstOrDefaultAsync(alert => alert.Id == alertId)
            ?? throw new InvalidOperationException("Alert not found and can't be resolved");
        alertToResolve.ResolvedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);
    }
    public async Task<IReadOnlyList<AlertLiveDto>> GetLiveForUserAsync(
        Guid userId,
        int limit = 100,
        CancellationToken ct = default)
    {
        return await dbContext.AlertUserStates
            .Where(s => s.UserId == userId && s.Alert.ResolvedAt == null )
            .OrderByDescending(s => s.Alert.CreatedAt)
            .Take(limit)
            .Select(s => new AlertLiveDto
            {
                AlertId = s.AlertId,
                AlertType = s.Alert.AlertType.ToString(),
                Message = s.Alert.Message,
                IsRead = s.IsRead,
                CreatedAt = new DateTimeOffset(s.Alert.CreatedAt, TimeSpan.Zero),
                ResolvedAt = s.Alert.ResolvedAt,

                ProductId = s.Alert.ProductId,
                ProductName = s.Alert.Product != null ? s.Alert.Product.Name : null,
                SKU = s.Alert.Product != null ? s.Alert.Product.SKU : null,

                WarehouseId = s.Alert.WarehouseId,
                WarehouseName = s.Alert.Warehouse != null ? s.Alert.Warehouse.Name : null,

                StockLocationId = s.Alert.StockLocationId,
                LocationCode = s.Alert.StockLocation != null ? AlertLiveDto.FormatLocation(s.Alert.StockLocation) : null,

                CurrentQuantity = s.Alert.CurrentQuantity,
                MinStockLevel = s.Alert.MinStockLevel,
                ReorderSuggestion = s.Alert.ReorderSuggestion,

                // Clamp to [0,100]; null when denominator is unknown/zero
                StockHealthPct = s.Alert.MinStockLevel > 0 && s.Alert.CurrentQuantity != null
                    ? (int)Math.Clamp(
                        (double)s.Alert.CurrentQuantity.Value / s.Alert.MinStockLevel.Value * 100,
                        0, 100)
                    : null,
            })
            .ToListAsync(ct);
    }

    public Task<int> MarkReadAsync(Guid userId, Guid alertId, CancellationToken ct = default) =>
        dbContext.AlertUserStates
            .Where(s => s.UserId == userId && s.AlertId == alertId)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.IsRead, true), ct);

    public Task<int> MarkAllReadAsync(Guid userId, CancellationToken ct = default) =>
        dbContext.AlertUserStates
            .Where(s => s.UserId == userId && !s.IsRead)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.IsRead, true), ct);
}
