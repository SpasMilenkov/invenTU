using InvenTU.Core.Contracts.Services;
using InvenTU.Core.DTOs.Stock;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InvenTU.Api.Controllers.V1;

/// <summary>
/// Controller for querying current stock levels.
/// </summary>
[ApiController]
[Route("api/v1/stock")]
[Authorize]
public sealed class StockController(IStockItemService stockItemService) : ControllerBase
{
    /// <summary>
    /// Returns location-level stock breakdown, optionally filtered by product and/or warehouse.
    /// Set <c>excludeZeroStock=true</c> to omit locations with no available quantity.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetStock([FromQuery] StockQueryParams query, CancellationToken cancellationToken)
    {
        var result = await stockItemService.GetStockAsync(query, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Returns total available quantity for a product aggregated across all warehouses,
    /// with a per-warehouse breakdown.
    /// </summary>
    [HttpGet("summary/{productId:guid}")]
    public async Task<IActionResult> GetSummary(Guid productId, CancellationToken cancellationToken)
    {
        var result = await stockItemService.GetSummaryAsync(productId, cancellationToken);
        return Ok(result);
    }
}
