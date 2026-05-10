using InvenTU.Core.Contracts.Services;
using InvenTU.Core.DTOs.Stock;
using InvenTU.Core.DTOs.Stock.StockMovement;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InvenTU.Api.Controllers.V1;

/// <summary>
/// Exposes endpoints for querying current stock levels and the stock movement
/// audit trail.
/// </summary>
[ApiController]
[Route("api/v1/stock")]
[Authorize]
public sealed class StockController(
    IStockItemService stockItemService,
    IStockMovementService stockMovementService) : ControllerBase
{
    /// <summary>
    /// Returns location-level stock breakdown, optionally filtered by product
    /// and/or warehouse.
    /// Set <c>excludeZeroStock=true</c> to omit locations with no available quantity.
    /// </summary>
    /// <param name="query">Optional filter parameters.</param>
    /// <param name="cancellationToken">Token used to propagate cancellation.</param>
    [HttpGet]
    public async Task<IActionResult> GetStock(
        [FromQuery] StockQueryParams query,
        CancellationToken cancellationToken)
    {
        var result = await stockItemService.GetStockAsync(query, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Returns total available quantity for a product aggregated across all
    /// warehouses, with a per-warehouse breakdown.
    /// </summary>
    /// <param name="productId">The unique identifier of the product to summarise.</param>
    /// <param name="cancellationToken">Token used to propagate cancellation.</param>
    [HttpGet("summary/{productId:guid}")]
    public async Task<IActionResult> GetSummary(
        Guid productId,
        CancellationToken cancellationToken)
    {
        var result = await stockItemService.GetSummaryAsync(productId, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Returns a paginated audit trail of all stock movements ordered by most
    /// recent first.
    /// </summary>
    /// <remarks>
    /// All filter parameters are optional and combined with AND logic.
    /// <list type="bullet">
    ///   <item><description>
    ///     <c>warehouseId</c> matches movements where the warehouse appears as
    ///     either source <em>or</em> destination.
    ///   </description></item>
    ///   <item><description>
    ///     Default page size is 50; maximum accepted value is 200.
    ///   </description></item>
    ///   <item><description>
    ///     <c>PerformedBy</c> and <c>PerformedAt</c> are always populated.
    ///     The response includes the performer's full display name resolved
    ///     via a database join rather than just the user identifier.
    ///   </description></item>
    /// </list>
    /// </remarks>
    /// <param name="query">Filter and pagination parameters.</param>
    /// <param name="cancellationToken">Token used to propagate cancellation.</param>
    /// <returns>
    /// A <c>PagedResult&lt;StockMovementDto&gt;</c> containing the current page
    /// of movement records and total-count metadata for client-side pagination.
    /// </returns>
    [HttpGet("movements")]
    public async Task<IActionResult> GetMovements(
        [FromQuery] StockMovementQueryParams query,
        CancellationToken cancellationToken)
    {
        var result = await stockMovementService.GetAsync(query, cancellationToken);
        return Ok(result);
    }

}
