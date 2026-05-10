namespace InvenTU.Core.DTOs.Reports;

/// <summary>
/// Response returned by <c>GET /api/v1/reports/turnover</c>.
/// Contains the effective date range, the number of calendar days covered,
/// and the per-product turnover data.
/// </summary>
public sealed record TurnoverReportResponse
{
    /// <summary>
    /// Start of the reporting window (UTC, inclusive).
    /// </summary>
    public required DateTime FromDate { get; init; }

    /// <summary>
    /// End of the reporting window (UTC, inclusive).
    /// </summary>
    public required DateTime ToDate { get; init; }

    /// <summary>
    /// Number of calendar days in the reporting window.
    /// Used to annualise the per-product turnover ratios.
    /// </summary>
    public required int DaysInPeriod { get; init; }

    /// <summary>
    /// Per-product turnover data. Products with zero average stock are excluded.
    /// Ordered by <see cref="ProductTurnoverDto.TurnoverRatio"/> descending.
    /// </summary>
    public required IReadOnlyList<ProductTurnoverDto> Items { get; init; }
}
