using InvenTU.Core.Contracts.Repositories;
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

    /// <inheritdoc />
    public async Task<IReadOnlyList<ProductTurnoverData>> GetTurnoverDataAsync(DateTime fromDate, DateTime toDate, CancellationToken cancellationToken)
    {
        // Step 1 — Retrieve all active, non-deleted products that currently hold stock.
        // The correlated subquery for on-hand quantity mirrors the pattern used in
        // StatsRepository.GetProductsBelowReorderPointAsync to stay consistent.
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
        // Only Issue-type movements with a confirmed status are included.
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
        var result = productsWithStock
            .Select(p => new ProductTurnoverData(
                ProductId: p.Id,
                ProductName: p.Name,
                SKU: p.SKU,
                TotalUnitsIssued: issuedByProduct.GetValueOrDefault(p.Id, 0m),
                AverageStockLevel: p.AverageStock))
            .ToList();

        return result;
    }
}
