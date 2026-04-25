using InvenTU.Core.DTOs.Common;
using InvenTU.Core.DTOs.Stock;
using InvenTU.Core.DTOs.Stock.StockMovement;

namespace InvenTU.Core.Contracts.Repositories;

/// <summary>
/// Read-only repository for querying the stock movement audit trail.
/// Write operations are handled by the individual operation repositories
/// (e.g. <c>IStockReceiptRepository</c>, <c>IStockIssueRepository</c>).
/// </summary>
public interface IStockMovementRepository
{
    /// <summary>
    /// Returns a paginated, filtered list of stock movement records with all
    /// related entity names resolved (product name, warehouse names, user display names).
    /// Results are ordered by <c>CreatedAt</c> descending so the most recent
    /// movements appear first.
    /// </summary>
    /// <param name="query">
    /// Filter and pagination parameters. All filters are optional and combined
    /// with AND logic. Page size is capped by the service layer before this
    /// method is called.
    /// </param>
    /// <param name="cancellationToken">Token used to propagate cancellation.</param>
    /// <returns>
    /// A <see cref="PagedResult{StockMovementDto}"/> containing the current page
    /// of results and total-count metadata for client-side pagination.
    /// </returns>
    Task<PagedResult<StockMovementDto>> GetAsync(
        StockMovementQueryParams query,
        CancellationToken cancellationToken = default);
}
