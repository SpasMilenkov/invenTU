using InvenTU.Core.DTOs.Common;
using InvenTU.Core.DTOs.Stock;
using InvenTU.Core.DTOs.Stock.StockMovement;

namespace InvenTU.Core.Contracts.Services;

/// <summary>
/// Application service for querying the stock movement audit trail.
/// Responsible for input sanitisation (page bounds, date range validation)
/// before delegating to <see cref="InvenTU.Core.Contracts.Repositories.IStockMovementRepository"/>.
/// </summary>
public interface IStockMovementService
{
    /// <summary>
    /// Returns a paginated, filtered list of stock movements ordered by most
    /// recent first.
    /// </summary>
    /// <param name="query">
    /// Filter and pagination parameters supplied by the caller.
    /// The service sanitises page number and clamps <c>PageSize</c> to a
    /// maximum of 200 before forwarding to the repository.
    /// </param>
    /// <param name="cancellationToken">Token used to propagate cancellation.</param>
    /// <returns>
    /// A <see cref="PagedResult{StockMovementDto}"/> containing the resolved
    /// movement records and navigation metadata.
    /// </returns>
    /// <exception cref="ArgumentNullException">
    /// Thrown when <paramref name="query"/> is <see langword="null"/>.
    /// </exception>
    /// <exception cref="ArgumentException">
    /// Thrown when <c>FromDate</c> is later than <c>ToDate</c>.
    /// </exception>
    Task<PagedResult<StockMovementDto>> GetAsync(
        StockMovementQueryParams query,
        CancellationToken cancellationToken = default);
}
