using InvenTU.Core.Contracts.Repositories;
using InvenTU.Core.DTOs.Stats;
using InvenTU.Core.Enums;
using InvenTU.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InvenTU.Infrastructure.Repositories;

/// <summary>
/// EF Core implementation of <see cref="IStatsRepository"/>.
/// All methods are read-only aggregation queries — no change tracking is needed.
///
/// Queries are executed sequentially rather than concurrently because
/// <see cref="DbContext"/> is not thread-safe; running multiple materialising
/// operations in parallel on the same context instance causes runtime errors.
/// </summary>
public sealed class StatsRepository(InvenTUDbContext context) : IStatsRepository
{
    /// <summary>
    /// Purchase order statuses considered terminal (order is fully closed).
    /// Compared against the <see cref="PurchaseOrderStatus"/> enum so EF Core can
    /// translate the predicate directly to a parameterised SQL <c>WHERE</c> clause.
    /// </summary>
    private static readonly HashSet<PurchaseOrderStatus> TerminalOrderStatuses =
        [PurchaseOrderStatus.Received, PurchaseOrderStatus.Submitted];

    // -------------------------------------------------------------------------
    // Inventory health
    // -------------------------------------------------------------------------

    /// <inheritdoc />
    public async Task<InventoryHealthData> GetInventoryHealthAsync(CancellationToken cancellationToken)
    {
        var totalActiveProducts = await GetTotalActiveProductsAsync(cancellationToken);
        var totalStockValue = await GetTotalStockValueAsync(cancellationToken);
        var belowReorderPoint = await GetProductsBelowReorderPointAsync(cancellationToken);
        var totalStockUnits = await GetTotalStockUnitsAsync(cancellationToken);
        var totalStockLocations = await GetTotalStockLocationsAsync(cancellationToken);

        return new InventoryHealthData(
            TotalActiveProducts: totalActiveProducts,
            TotalStockValue: totalStockValue,
            ProductsBelowReorderPoint: belowReorderPoint,
            TotalStockUnits: totalStockUnits,
            TotalStockLocations: totalStockLocations);
    }

    /// <summary>
    /// Counts products that are active and have not been soft-deleted.
    /// </summary>
    private Task<int> GetTotalActiveProductsAsync(CancellationToken ct) =>
        context.Products
            .AsNoTracking()
            .Where(p => p.IsActive && p.DeletedAt == null)
            .CountAsync(ct);

    /// <summary>
    /// Sums the on-hand stock value as <c>SUM(StockItems.Quantity × Products.CostPrice)</c>.
    /// Returns zero when no stock items exist.
    /// </summary>
    private Task<decimal> GetTotalStockValueAsync(CancellationToken ct) =>
        (from si in context.StockItems.AsNoTracking()
         join p in context.Products.AsNoTracking() on si.ProductId equals p.Id
         select si.Quantity * p.CostPrice)
        .SumAsync(ct);

    /// <summary>
    /// Counts active, non-deleted products whose total on-hand quantity across all
    /// stock locations is at or below their configured <c>ReorderPoint</c>.
    /// Uses a correlated subquery that EF Core translates to a single SQL statement.
    /// </summary>
    private Task<int> GetProductsBelowReorderPointAsync(CancellationToken ct) =>
        (from p in context.Products.AsNoTracking()
         where p.IsActive && p.DeletedAt == null
         let onHand = context.StockItems
             .Where(si => si.ProductId == p.Id)
             .Sum(si => (decimal?)si.Quantity) ?? 0m
         where onHand <= p.ReorderPoint
         select p.Id)
        .CountAsync(ct);

    /// <summary>
    /// Sums all <c>StockItems.Quantity</c> values across every location.
    /// Returns zero when the table is empty.
    /// </summary>
    private Task<decimal> GetTotalStockUnitsAsync(CancellationToken ct) =>
        context.StockItems
            .AsNoTracking()
            .SumAsync(si => (decimal?)si.Quantity ?? 0m, ct);

    /// <summary>
    /// Counts every bin-level stock location registered across all warehouses.
    /// </summary>
    private Task<int> GetTotalStockLocationsAsync(CancellationToken ct) =>
        context.StockLocations
            .AsNoTracking()
            .CountAsync(ct);

    // -------------------------------------------------------------------------
    // Alert summary
    // -------------------------------------------------------------------------

    /// <inheritdoc />
    public async Task<AlertSummaryData> GetAlertSummaryAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var unresolvedAlerts = context.Alerts
            .AsNoTracking()
            .Where(a => a.ResolvedAt == null);

        var totalUnresolved = await unresolvedAlerts
            .CountAsync(cancellationToken);

        var unreadForUser = await unresolvedAlerts
            .Where(a => !context.AlertUserStates
                .Any(aus => aus.AlertId == a.Id && aus.UserId == userId && aus.IsRead))
            .CountAsync(cancellationToken);

        // Materialise with enum keys first — EF Core cannot translate enum.ToString()
        // to SQL, so the projection to string happens on the client after the query.
        var byTypeRaw = await unresolvedAlerts
            .GroupBy(a => a.AlertType)
            .Select(g => new { Type = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var byType = byTypeRaw.ToDictionary(x => x.Type.ToString(), x => x.Count);

        return new AlertSummaryData(
            TotalUnresolved: totalUnresolved,
            UnreadForCurrentUser: unreadForUser,
            ByType: byType);
    }

    // -------------------------------------------------------------------------
    // Purchase order pipeline
    // -------------------------------------------------------------------------

    /// <inheritdoc />
    public async Task<PurchaseOrderPipelineData> GetPurchaseOrderPipelineAsync(
        CancellationToken cancellationToken)
    {
        var openOrders = context.PurchaseOrders
            .AsNoTracking()
            .Where(po => !TerminalOrderStatuses.Contains(po.Status));

        var totalOpenOrders = await openOrders
            .CountAsync(cancellationToken);

        var totalOpenValue = await (
            from po in openOrders
            join pol in context.PurchaseOrderLines.AsNoTracking()
                on po.Id equals pol.PurchaseOrderId
            select pol.Quantity * pol.UnitPrice
        ).SumAsync(v => (decimal?)v ?? 0m, cancellationToken);

        // Materialise with enum keys first — same reason as AlertType above.
        var byStatusRaw = await context.PurchaseOrders
            .AsNoTracking()
            .GroupBy(po => po.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var byStatus = byStatusRaw.ToDictionary(x => x.Status.ToString(), x => x.Count);

        return new PurchaseOrderPipelineData(
            TotalOpenOrders: totalOpenOrders,
            TotalOpenValue: totalOpenValue,
            ByStatus: byStatus);
    }

    // Public / anonymous summary

    /// <inheritdoc />
    public async Task<PublicSummaryData> GetPublicSummaryAsync(CancellationToken cancellationToken)
    {
        var activeWarehouses = await context.Warehouses
            .AsNoTracking()
            .Where(w => w.IsActive && w.IsActive)
            .CountAsync(cancellationToken);

        var activeSkus = await context.Products
            .AsNoTracking()
            .Where(p => p.IsActive && p.DeletedAt == null)
            .CountAsync(cancellationToken);

        var stockLocations = await context.StockLocations
            .AsNoTracking()
            .CountAsync(cancellationToken);

        return new PublicSummaryData(activeWarehouses, activeSkus, stockLocations);
    }
}
