using InvenTU.Core.Contracts.Services;
using InvenTU.Core.DTOs.Stock;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InvenTU.Api.Controllers.V1;

/// <summary>
/// Handles stock transfers between warehouse locations.
/// Requires Manager or Admin role to execute a transfer.
/// </summary>
[ApiController]
[Route("api/v1/stock/transfers")]
[Authorize]
public sealed class StockTransfersController(IStockTransferService stockTransferService) : ControllerBase
{
    /// <summary>
    /// Transfers stock from one warehouse location to another.
    /// Returns 422 if the destination warehouse capacity would be exceeded,
    /// or if there is insufficient stock at the source location.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Manager,Admin")]
    public async Task<IActionResult> Transfer([FromBody] TransferStockRequest request, CancellationToken cancellationToken)
    {
        var result = await stockTransferService.TransferAsync(request, cancellationToken);
        return Ok(result);
    }
}
