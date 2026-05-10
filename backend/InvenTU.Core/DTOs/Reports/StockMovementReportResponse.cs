namespace InvenTU.Core.DTOs.Reports;

/// <summary>
/// Aggregated response for the stock movement PDF report.
/// Contains the full, unfiltered-beyond-query-params movement list together
/// with pre-computed summary statistics used to render the report footer.
/// </summary>
public sealed record StockMovementReportResponse
{
    /// <summary>UTC timestamp at which the report was generated.</summary>
    public required DateTime GeneratedAt { get; init; }

    /// <summary>
    /// The filter parameters that were applied to produce this report,
    /// including resolved defaults for any omitted date values.
    /// </summary>
    public required StockMovementReportQueryParams Filters { get; init; }

    /// <summary>
    /// All movement rows that satisfy the applied filters, ordered by
    /// <see cref="StockMovementReportRow.CreatedAt"/> descending.
    /// </summary>
    public required IReadOnlyList<StockMovementReportRow> Items { get; init; }

    /// <summary>
    /// Total row count broken down by
    /// <see cref="StockMovementReportRow.MovementType"/>.
    /// </summary>
    public required IReadOnlyDictionary<string, int> CountsByType { get; init; }

    /// <summary>
    /// Total row count broken down by
    /// <see cref="StockMovementReportRow.Status"/>.
    /// </summary>
    public required IReadOnlyDictionary<string, int> CountsByStatus { get; init; }

    /// <summary>
    /// Sum of <see cref="StockMovementReportRow.Quantity"/> across all rows
    /// in the report.
    /// </summary>
    public required decimal TotalQuantityMoved { get; init; }
}
