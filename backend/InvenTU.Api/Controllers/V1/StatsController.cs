using InvenTU.Core.Contracts.Services;
using InvenTU.Core.DTOs.Stats;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InvenTU.Api.Controllers.V1;

/// <summary>
/// Controller for retrieving dashboard statistics.
/// All endpoints require authentication. All roles have read access.
/// </summary>
[ApiController]
[Route("api/v1/stats")]
[Authorize]
public sealed class StatsController(IStatsService statsService) : ControllerBase
{
    /// <summary>
    /// Returns a snapshot of overall inventory health, including total active
    /// products, aggregated stock value, and the count of products that have
    /// fallen below their configured reorder point.
    /// </summary>
    /// <param name="cancellationToken">Token used to cancel the request.</param>
    /// <returns>
    /// An <see cref="InventoryHealthResponse"/> containing:
    /// <list type="bullet">
    ///   <item><description><c>TotalActiveProducts</c> — number of non-deleted, active products.</description></item>
    ///   <item><description><c>TotalStockValue</c> — sum of (StockItem.Quantity × Product.CostPrice) across all locations.</description></item>
    ///   <item><description><c>ProductsBelowReorderPoint</c> — products whose current quantity is at or below <c>ReorderPoint</c>.</description></item>
    ///   <item><description><c>TotalStockUnits</c> — total units on hand across all stock locations.</description></item>
    /// </list>
    /// </returns>
    [HttpGet("inventory-health")]
    public async Task<IActionResult> GetInventoryHealth(CancellationToken cancellationToken)
    {
        var result = await statsService.GetInventoryHealthAsync(cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Returns a summary of all currently active (unresolved) alerts, broken
    /// down by alert type, along with a count of alerts the calling user has
    /// not yet read.
    /// </summary>
    /// <param name="cancellationToken">Token used to cancel the request.</param>
    /// <returns>
    /// An <see cref="AlertSummaryResponse"/> containing:
    /// <list type="bullet">
    ///   <item><description><c>TotalUnresolved</c> — alerts where <c>ResolvedAt</c> is null.</description></item>
    ///   <item><description><c>UnreadForCurrentUser</c> — unresolved alerts without a matching read <c>AlertUserState</c> for the caller.</description></item>
    ///   <item><description><c>ByType</c> — dictionary of <c>AlertType → count</c> for all unresolved alerts.</description></item>
    /// </list>
    /// </returns>
    [HttpGet("alerts")]
    public async Task<IActionResult> GetAlertSummary(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var result = await statsService.GetAlertSummaryAsync(userId, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Returns a breakdown of all purchase orders grouped by status, along
    /// with the total outstanding financial commitment across all open orders.
    /// </summary>
    /// <param name="cancellationToken">Token used to cancel the request.</param>
    /// <returns>
    /// A <see cref="PurchaseOrderPipelineResponse"/> containing:
    /// <list type="bullet">
    ///   <item><description><c>TotalOpenOrders</c> — orders not yet in a terminal status (e.g. not Received/Cancelled).</description></item>
    ///   <item><description><c>TotalOpenValue</c> — sum of (Line.Quantity × Line.UnitPrice) for all open orders.</description></item>
    ///   <item><description><c>ByStatus</c> — dictionary of <c>Status → count</c> across all purchase orders.</description></item>
    /// </list>
    /// </returns>
    [HttpGet("purchase-order-pipeline")]
    public async Task<IActionResult> GetPurchaseOrderPipeline(CancellationToken cancellationToken)
    {
        var result = await statsService.GetPurchaseOrderPipelineAsync(cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Extracts the authenticated user's id from the current JWT claims.
    /// Throws if the claim is missing or malformed.
    /// </summary>
    /// <returns>The <see cref="Guid"/> identity of the calling user.</returns>
    /// <exception cref="InvalidOperationException">
    /// Thrown when the NameIdentifier claim is absent or cannot be parsed as a <see cref="Guid"/>.
    /// </exception>
    private Guid GetCurrentUserId()
    {
        var raw = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                  ?? throw new InvalidOperationException("NameIdentifier claim is missing from the token.");

        return Guid.Parse(raw);
    }

    /// <summary>
    /// Returns a lightweight public summary of active warehouses, SKUs, and
    /// stock locations. Intentionally anonymous — safe to display on the
    /// login/marketing shell without an authenticated session.
    /// </summary>
    /// <param name="cancellationToken">Token used to cancel the request.</param>
    /// <returns>
    /// A <see cref="PublicSummaryResponse"/> containing:
    /// <list type="bullet">
    ///   <item><description><c>ActiveWarehouses</c> — count of non-deleted, active warehouses.</description></item>
    ///   <item><description><c>ActiveSkus</c> — count of non-deleted, active products.</description></item>
    ///   <item><description><c>StockLocations</c> — total bin-level stock location count.</description></item>
    /// </list>
    /// </returns>
    [AllowAnonymous]
    [HttpGet("public-summary")]
    public async Task<IActionResult> GetPublicSummary(CancellationToken cancellationToken)
    {
        var result = await statsService.GetPublicSummaryAsync(cancellationToken);
        return Ok(result);
    }
}
