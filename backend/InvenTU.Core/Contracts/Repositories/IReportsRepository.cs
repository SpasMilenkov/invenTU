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
}

/// <summary>
/// Raw per-product data fetched from the database for turnover calculation.
/// </summary>
/// <param name="ProductId">Product identifier.</param>
/// <param name="ProductName">Product display name.</param>
/// <param name="SKU">Stock-keeping unit code.</param>
/// <param name="TotalUnitsIssued">
/// Sum of quantities on Issue movements within the reporting window
/// (status <c>Active</c> or <c>Approved</c> only).
/// </param>
/// <param name="AverageStockLevel">
/// Current on-hand quantity across all stock locations (point-in-time snapshot).
/// Always greater than zero — the repository filters out zero-stock products.
/// </param>
public sealed record ProductTurnoverData(
    Guid ProductId,
    string ProductName,
    string SKU,
    decimal TotalUnitsIssued,
    decimal AverageStockLevel);
