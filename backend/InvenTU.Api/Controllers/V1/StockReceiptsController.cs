using InvenTU.Core.Contracts.Services;
using InvenTU.Core.DTOs.Stock;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InvenTU.Api.Controllers.V1;

/// <summary>
/// Handles incoming stock receipts from suppliers or returns.
/// Requires Manager or Admin role to record a receipt.
/// </summary>
[ApiController]
[Route("api/v1/stock/receipts")]
[Authorize]
public sealed class StockReceiptsController(IStockReceiptService stockReceiptService) : ControllerBase
{
    /// <summary>
    /// Records incoming stock at a target warehouse location.
    /// Creates a StockMovement record with type=Receipt, upserts the StockItem
    /// for the target location, and stores an optional PO reference number.
    /// Returns 400 if the target location does not exist or does not belong to the warehouse.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Manager,Admin")]
    public async Task<IActionResult> Receive([FromBody] ReceiveStockRequest request, CancellationToken cancellationToken)
    {
        var result = await stockReceiptService.ReceiveAsync(request, cancellationToken);
        return Ok(result);
    }
}
