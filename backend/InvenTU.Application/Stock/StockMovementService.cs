using InvenTU.Core.Contracts.Repositories;
using InvenTU.Core.Contracts.Services;
using InvenTU.Core.DTOs.Common;
using InvenTU.Core.DTOs.Stock;
using InvenTU.Core.DTOs.Stock.StockMovement;

namespace InvenTU.Application.Stock;

/// <summary>
/// Application service that sanitises caller-supplied query parameters and
/// delegates to <see cref="IStockMovementRepository"/> to retrieve the
/// paginated stock movement audit trail.
/// </summary>
public sealed class StockMovementService(IStockMovementRepository stockMovementRepository) : IStockMovementService
{
    /// <summary>
    /// The maximum number of items a caller may request in a single page.
    /// Requests that exceed this value are silently clamped.
    /// </summary>
    private const int MaxPageSize = 200;

    /// <inheritdoc/>
    public Task<PagedResult<StockMovementDto>> GetAsync(
        StockMovementQueryParams query,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(query);

        if (query.FromDate.HasValue && query.ToDate.HasValue && query.FromDate.Value > query.ToDate.Value)
        {
            throw new ArgumentException("FromDate must not be later than ToDate.", nameof(query));
        }

        // Clamp values so the repository always receives safe bounds.
        // StockMovementQueryParams is a sealed class (not a record) so we
        // construct a new instance explicitly rather than using a with expression.
        var sanitised = new StockMovementQueryParams
        {
            ProductId = query.ProductId,
            WarehouseId = query.WarehouseId,
            Type = query.Type,
            FromDate = query.FromDate,
            ToDate = query.ToDate,
            Page = Math.Max(1, query.Page),
            PageSize = Math.Clamp(query.PageSize, 1, MaxPageSize),
        };

        return stockMovementRepository.GetAsync(sanitised, cancellationToken);
    }
}
