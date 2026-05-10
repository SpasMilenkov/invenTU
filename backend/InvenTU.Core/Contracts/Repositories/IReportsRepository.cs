using InvenTU.Core.DTOs.Reports;

namespace InvenTU.Core.Contracts.Repositories;

/// <summary>
/// Data-access contract for reporting queries.
/// Implementations execute read-only aggregation queries directly against the database.
/// </summary>
public interface IReportsRepository
{
    /// <summary>
    /// Returns the raw per-product data required to compute inventory turnover ratios.
    /// Only active, non-deleted products with a current on-hand quantity greater than zero
    /// are included.
    /// </summary>
    /// <param name="fromDate">Start of the reporting window (UTC, inclusive).</param>
    /// <param name="toDate">End of the reporting window (UTC, inclusive).</param>
    /// <param name="cancellationToken">Token used to cancel the database queries.</param>
    /// <returns>
    /// A list of <see cref="ProductTurnoverData"/> records — one per qualifying product.
    /// The list is unordered; callers are responsible for any sorting.
    /// </returns>
    Task<IReadOnlyList<ProductTurnoverData>> GetTurnoverDataAsync(DateTime fromDate, DateTime toDate, CancellationToken cancellationToken);

    /// <summary>
    /// Returns all data required to compute FIFO-based inventory valuation.
    /// Only active, non-deleted products with on-hand stock greater than zero are included.
    /// </summary>
    /// <param name="warehouseId">When supplied, restricts stock quantities to this warehouse.</param>
    /// <param name="categoryId">When supplied, restricts products to this category.</param>
    /// <param name="cancellationToken">Token used to cancel the database queries.</param>
    Task<InventoryValuationRaw> GetInventoryValuationDataAsync(Guid? warehouseId, Guid? categoryId, CancellationToken cancellationToken);
}
