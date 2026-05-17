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

    /// <summary>
    /// Retrieves all stock movements that satisfy the supplied filters, joined
    /// with product, warehouse, and user data required for PDF rendering.
    /// </summary>
    /// <param name="fromDate">
    /// Optional start of the date range (UTC, inclusive).
    /// When <c>null</c> no lower-bound date filter is applied.
    /// </param>
    /// <param name="toDate">
    /// Optional end of the date range (UTC, inclusive).
    /// When <c>null</c> no upper-bound date filter is applied.
    /// </param>
    /// <param name="warehouseId">
    /// When supplied, restricts results to movements where the warehouse
    /// appears as either the source <em>or</em> the destination.
    /// </param>
    /// <param name="movementType">
    /// Optional movement-type filter (e.g. <c>Issue</c>, <c>Receipt</c>).
    /// </param>
    /// <param name="status">
    /// Optional status filter (e.g. <c>Approved</c>, <c>Pending</c>).
    /// </param>
    /// <param name="productId">Optional product filter.</param>
    /// <param name="cancellationToken">
    /// Token used to propagate cancellation.
    /// </param>
    /// <returns>
    /// All matching movement rows ordered by <c>CreatedAt</c> descending.
    /// Returns an empty list when no movements match the criteria.
    /// </returns>
    Task<IReadOnlyList<StockMovementReportRow>> GetStockMovementsForReportAsync(
        DateTime? fromDate,
        DateTime? toDate,
        Guid? warehouseId,
        string? movementType,
        string? status,
        Guid? productId,
        CancellationToken cancellationToken);

}
