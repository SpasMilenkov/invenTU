using InvenTU.Core.Contracts.Services;
using InvenTU.Core.DTOs.Stock;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InvenTU.Api.Controllers.V1;

/// <summary>
/// Handles stock count corrections (physical inventory adjustments).
/// Workers can submit adjustments; managers approve or reject those above the 10% threshold.
/// </summary>
[ApiController]
[Route("api/v1/stock/adjustments")]
[Authorize]
public sealed class StockAdjustmentsController(IStockAdjustmentService stockAdjustmentService) : ControllerBase
{
    /// <summary>
    /// Submits a stock count correction for a location.
    /// Adjustments within 10% of current stock are auto-approved (status=Active).
    /// Adjustments exceeding the 10% threshold or with negative counted quantity require
    /// manager approval (status=PendingApproval).
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Worker,Manager,Admin")]
    public async Task<IActionResult> Submit([FromBody] AdjustStockRequest request, CancellationToken cancellationToken)
    {
        var result = await stockAdjustmentService.SubmitAsync(request, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Returns all stock adjustments currently awaiting manager approval.
    /// </summary>
    [HttpGet("pending")]
    [Authorize(Roles = "Manager,Admin")]
    public async Task<IActionResult> GetPending(CancellationToken cancellationToken)
    {
        var result = await stockAdjustmentService.GetPendingAsync(cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Approves a pending stock adjustment and applies the counted quantity to stock.
    /// </summary>
    [HttpPatch("{id:guid}/approve")]
    [Authorize(Roles = "Manager,Admin")]
    public async Task<IActionResult> Approve(Guid id, [FromBody] ReviewAdjustmentRequest request, CancellationToken cancellationToken)
    {
        var result = await stockAdjustmentService.ApproveAsync(id, request, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Rejects a pending stock adjustment. Stock levels remain unchanged.
    /// </summary>
    [HttpPatch("{id:guid}/reject")]
    [Authorize(Roles = "Manager,Admin")]
    public async Task<IActionResult> Reject(Guid id, [FromBody] ReviewAdjustmentRequest request, CancellationToken cancellationToken)
    {
        var result = await stockAdjustmentService.RejectAsync(id, request, cancellationToken);
        return Ok(result);
    }
}
