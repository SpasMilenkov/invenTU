using InvenTU.Core.Contracts.Services;
using InvenTU.Core.DTOs.Reports;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InvenTU.Api.Controllers.V1;

/// <summary>
/// Controller for generating inventory reports.
/// All endpoints require authentication.
/// </summary>
[ApiController]
[Route("api/v1/reports")]
[Authorize]
public sealed class ReportsController(IReportsService reportsService) : ControllerBase
{
    /// <summary>
    /// Calculates the annualised inventory turnover ratio per product for the specified date range.
    /// </summary>
    /// <remarks>
    /// The turnover ratio is computed as:
    /// <code>(total units issued ÷ average stock level) × (365 ÷ days in period)</code>
    ///
    /// <b>Average stock level</b> is the current on-hand quantity across all stock locations
    /// (point-in-time snapshot at query time). Products with zero on-hand stock are excluded.
    ///
    /// <b>Issued units</b> counts only <c>Issue</c>-type stock movements with a confirmed status
    /// (<c>Active</c> or <c>Approved</c>) whose <c>CreatedAt</c> falls within the date range.
    ///
    /// <b>Classification thresholds (annualised):</b>
    /// <list type="bullet">
    ///   <item><c>FastMoving</c> — turnover ratio &gt; 12 turns per year.</item>
    ///   <item><c>SlowMoving</c> — turnover ratio &lt; 2 turns per year.</item>
    ///   <item><c>Normal</c>     — turnover ratio between 2 and 12 (inclusive).</item>
    /// </list>
    ///
    /// When neither <c>fromDate</c> nor <c>toDate</c> is supplied, the endpoint defaults
    /// to the last 90 days ending at the current UTC time.
    /// </remarks>
    /// <param name="query">Optional date range. Both dates default to the last 90 days when omitted.</param>
    /// <param name="cancellationToken">Token used to cancel the request.</param>
    /// <returns>
    /// A <see cref="TurnoverReportResponse"/> containing the effective date range,
    /// the number of calendar days covered, and per-product turnover data ordered
    /// by turnover ratio descending.
    /// </returns>
    [HttpGet("turnover")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetTurnover([FromQuery] TurnoverQueryParams query, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(query, nameof(query));

        var toDate = query.ToDate ?? DateTime.UtcNow;
        var fromDate = query.FromDate ?? toDate.AddDays(-90);

        if (fromDate > toDate)
        {
            return BadRequest("fromDate must not be later than toDate.");
        }

        var result = await reportsService.GetTurnoverAsync(fromDate, toDate, cancellationToken);
        return Ok(result);
    }
}
