using InvenTU.Core.Contracts.Services;
using InvenTU.Core.DTOs.Stock;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InvenTU.Api.Controllers.V1;

/// <summary>
/// Handles stock issues — stock leaving the warehouse (sales picks, write-offs).
/// Workers, Managers, and Admins may perform issues.
/// </summary>
[ApiController]
[Route("api/v1/stock/issues")]
[Authorize]
public sealed class StockIssuesController(IStockIssueService stockIssueService) : ControllerBase
{
    /// <summary>
    /// Issues (removes) stock from a warehouse location.
    /// Returns 422 if available stock (on-hand minus reserved) is insufficient.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Worker,Manager,Admin")]
    public async Task<IActionResult> Issue([FromBody] IssueStockRequest request, CancellationToken cancellationToken)
    {
        var result = await stockIssueService.IssueAsync(request, cancellationToken);
        return Ok(result);
    }
}
