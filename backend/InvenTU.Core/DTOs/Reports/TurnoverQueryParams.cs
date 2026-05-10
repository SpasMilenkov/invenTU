namespace InvenTU.Core.DTOs.Reports;

/// <summary>
/// Query parameters accepted by <c>GET /api/v1/reports/turnover</c>.
/// Both dates are optional; when omitted the endpoint defaults to the last 90 days.
/// </summary>
public sealed class TurnoverQueryParams
{
    /// <summary>
    /// Start of the reporting window (UTC, inclusive).
    /// Defaults to <c>ToDate − 90 days</c> when not supplied.
    /// </summary>
    public DateTime? FromDate { get; init; }

    /// <summary>
    /// End of the reporting window (UTC, inclusive).
    /// Defaults to the current UTC timestamp when not supplied.
    /// </summary>
    public DateTime? ToDate { get; init; }
}
