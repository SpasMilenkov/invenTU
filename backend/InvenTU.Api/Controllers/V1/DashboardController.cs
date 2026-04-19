using InvenTU.Core.Contracts.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InvenTU.Api.Controllers.V1;

/// <summary>
/// Provides aggregated dashboard statistics for the inventory management system.
/// </summary>
[ApiController]
[Route("api/v1/dashboard")]
[Authorize]
public sealed class DashboardController(IDashboardService dashboardService) : ControllerBase
{
    /// <summary>
    /// Returns a single JSON object containing all dashboard metrics:
    /// active product count, active warehouse count, low-stock count,
    /// total stock value, the ten most recent stock movements, and the
    /// top eight categories by stock quantity.
    /// </summary>
    /// <param name="cancellationToken">Propagates a cancellation signal from the HTTP pipeline.</param>
    /// <response code="200">Dashboard statistics assembled successfully.</response>
    /// <response code="401">The request is not authenticated.</response>
    [HttpGet("stats")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetStats(CancellationToken cancellationToken)
    {
        var stats = await dashboardService.GetStatsAsync(cancellationToken);
        return Ok(stats);
    }
}
