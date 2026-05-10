using InvenTU.Core.Contracts.Repositories;
using InvenTU.Core.DTOs.Reports;
using InvenTU.Core.Entities;
using InvenTU.Core.Enums;
using InvenTU.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InvenTU.Infrastructure.Repositories;

/// <summary>
/// EF Core implementation of <see cref="IReportsRepository"/>.
/// All methods are read-only aggregation queries — no change tracking is required.
///
/// Queries are executed sequentially rather than concurrently because
/// <see cref="DbContext"/> is not thread-safe; running multiple materialising
/// operations in parallel on the same context instance causes runtime errors.
/// </summary>
public sealed class ReportsRepository(InvenTUDbContext context) : IReportsRepository
{
    /// <summary>
    /// Movement statuses that represent confirmed stock activity.
    /// Pending-approval and rejected movements are excluded from the issued-unit totals
    /// because they have not been committed to on-hand inventory.
    /// </summary>
    private static readonly HashSet<MovementStatus> ConfirmedStatuses = [MovementStatus.Active, MovementStatus.Approved];

    private static readonly PurchaseOrderStatus[] ReceivedStatuses = [PurchaseOrderStatus.Received, PurchaseOrderStatus.PartiallyReceived];

    /// <inheritdoc />
    public async Task<IReadOnlyList<ProductTurnoverData>> GetTurnoverDataAsync(DateTime fromDate, DateTime toDate, CancellationToken cancellationToken)
    {
        // Step 1 — Retrieve all active, non-deleted products that currently hold stock.
        var productsWithStock = await (
            from p in context.Products.AsNoTracking()
            where p.IsActive && p.DeletedAt == null
            let onHand = context.StockItems
                .Where(si => si.ProductId == p.Id)
                .Sum(si => (decimal?)si.Quantity) ?? 0m
            where onHand > 0m
            select new
            {
                p.Id,
                p.Name,
                p.SKU,
                AverageStock = onHand,
            })
            .ToListAsync(cancellationToken);

        if (productsWithStock.Count == 0)
        {
            return [];
        }

        // Step 2 — Retrieve total issued units per product within the reporting window.
        var productIds = productsWithStock.Select(p => p.Id).ToList();

        var issuedByProduct = await context.StockMovements
            .AsNoTracking()
            .Where(m =>
                m.MovementType == MovementType.Issue &&
                ConfirmedStatuses.Contains(m.Status) &&
                m.CreatedAt >= fromDate &&
                m.CreatedAt <= toDate &&
                productIds.Contains(m.ProductId))
            .GroupBy(m => m.ProductId)
            .Select(g => new { ProductId = g.Key, TotalIssued = g.Sum(m => m.Quantity) })
            .ToDictionaryAsync(x => x.ProductId, x => x.TotalIssued, cancellationToken);

        // Step 3 — Combine both result sets in-process.
        return productsWithStock
            .Select(p => new ProductTurnoverData(
                ProductId: p.Id,
                ProductName: p.Name,
                SKU: p.SKU,
                TotalUnitsIssued: issuedByProduct.GetValueOrDefault(p.Id, 0m),
                AverageStockLevel: p.AverageStock))
            .ToList();
    }

    /// <inheritdoc />
    public async Task<InventoryValuationRaw> GetInventoryValuationDataAsync(Guid? warehouseId, Guid? categoryId, CancellationToken cancellationToken)
    {
        // Step 1 — Aggregate on-hand quantities per product using a GROUP BY + JOIN.
        // This avoids correlated subqueries and stays efficient for large catalogues;
        // EF Core translates the join against the grouped IQueryable to a single SQL statement.
        var stockItemQuery = context.StockItems.AsNoTracking();
        if (warehouseId.HasValue)
        {
            var wid = warehouseId.Value;
            stockItemQuery = stockItemQuery.Where(si => si.StockLocation.WarehouseId == wid);
        }

        var stockTotals = stockItemQuery
            .GroupBy(si => si.ProductId)
            .Select(g => new { ProductId = g.Key, OnHand = g.Sum(si => si.Quantity) })
            .Where(x => x.OnHand > 0);

        // Step 2 — Join with product / category metadata in a single round-trip.
        var productBaseQuery = context.Products.AsNoTracking()
            .Where(p => p.IsActive && p.DeletedAt == null);

        if (categoryId.HasValue)
        {
            var cid = categoryId.Value;
            productBaseQuery = productBaseQuery.Where(p => p.CategoryId == cid);
        }

        var snapshots = await (
            from p in productBaseQuery
            join s in stockTotals on p.Id equals s.ProductId
            select new ProductStockSnapshot(
                p.Id,
                p.SKU,
                p.Name,
                p.Category.Name,
                s.OnHand,
                p.CostPrice))
            .ToListAsync(cancellationToken);

        if (snapshots.Count == 0)
            return new InventoryValuationRaw([], []);

        // Step 3 — Fetch purchase-order lines for received / partially-received POs.
        // The service layer will sort these and apply FIFO pricing logic.
        var productIds = snapshots.Select(p => p.ProductId).ToList();

        var poLines = await (
            from line in context.PurchaseOrderLines.AsNoTracking()
            where productIds.Contains(line.ProductId)
                  && ReceivedStatuses.Contains(line.PurchaseOrder.Status)
            select new ProductPoLine(
                line.ProductId,
                line.PurchaseOrder.OrderDate,
                line.Quantity,
                line.UnitPrice))
            .ToListAsync(cancellationToken);

        return new InventoryValuationRaw(snapshots, poLines);
    }
}
