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

    /// <inheritdoc />
    public async Task<IReadOnlyList<StockMovementReportRow>> GetStockMovementsForReportAsync(
        DateTime?         fromDate,
        DateTime?         toDate,
        Guid?             warehouseId,
        string?           movementType,
        string?           status,
        Guid?             productId,
        CancellationToken cancellationToken)
    {
        // Resolve string filter params to enums before entering the
        //    expression tree — EF Core cannot translate Enum.Parse to SQL.
        //    Invalid / unrecognised strings are treated as "no filter".
        MovementType? movementTypeFilter =
            movementType is not null && Enum.TryParse<MovementType>(movementType, ignoreCase: true, out var mt)
                ? mt
                : null;

        MovementStatus? statusFilter =
            status is not null && Enum.TryParse<MovementStatus>(status, ignoreCase: true, out var ms)
                ? ms
                : null;

        // Query — enum-to-enum comparisons translate cleanly to SQL.
        //    Warehouse name resolution and enum-to-string conversion are
        //    intentionally deferred to the in-memory projection below to
        //    avoid EF Core translation issues with .ToString() on enums.
        var raw = await (
            from sm in context.StockMovements
            join p  in context.Products  on sm.ProductId equals p.Id
            join u  in context.Users     on sm.UserId    equals u.Id

            // Source warehouse — null for purely inbound movements (e.g. Receipt)
            join sw in context.Warehouses
                on sm.SourceWarehouseId equals (Guid?)sw.Id into sourceJoin
            from sw in sourceJoin.DefaultIfEmpty()

            // Destination warehouse — null for purely outbound movements (e.g. Issue)
            join dw in context.Warehouses
                on sm.DestinationWarehouseId equals (Guid?)dw.Id into destJoin
            from dw in destJoin.DefaultIfEmpty()

            where (!fromDate.HasValue           || sm.CreatedAt >= fromDate.Value)
               && (!toDate.HasValue             || sm.CreatedAt <= toDate.Value)
               && (!warehouseId.HasValue        || sm.SourceWarehouseId     == warehouseId.Value
                                               || sm.DestinationWarehouseId == warehouseId.Value)
               && (!movementTypeFilter.HasValue || sm.MovementType == movementTypeFilter.Value)
               && (!statusFilter.HasValue       || sm.Status       == statusFilter.Value)
               && (!productId.HasValue          || sm.ProductId    == productId.Value)

            orderby sm.CreatedAt descending

            select new
            {
                sm.Id,
                sm.CreatedAt,
                sm.ReferenceNumber,
                ProductName         = p.Name,
                p.SKU,
                sm.MovementType,   // enum — projected to string below
                sm.Quantity,
                SourceWarehouse     = sw != null ? sw.Name : null,
                DestinationWarehouse= dw != null ? dw.Name : null,
                sm.Status,         // enum — projected to string below
                PerformedBy         = u.FirstName + " " + u.LastName,
                sm.Notes,
            }

        ).ToListAsync(cancellationToken);

        // In-memory projection — safe to call .ToString() on enums here.
        return raw.ConvertAll(r => new StockMovementReportRow(
            r.Id,
            r.CreatedAt,
            r.ReferenceNumber,
            r.ProductName,
            r.SKU,
            r.MovementType.ToString(),
            r.Quantity,
            r.SourceWarehouse,
            r.DestinationWarehouse,
            r.Status.ToString(),
            r.PerformedBy,
            r.Notes));
    }


}
