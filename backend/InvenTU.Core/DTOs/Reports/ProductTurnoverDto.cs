namespace InvenTU.Core.DTOs.Reports;

/// <summary>
/// Inventory turnover data for a single product.
/// Returned as part of <see cref="TurnoverReportResponse"/>.
/// </summary>
public sealed record ProductTurnoverDto
{
    /// <summary>
    /// Product identifier.
    /// </summary>
    public required Guid ProductId { get; init; }

    /// <summary>
    /// Product display name.
    /// </summary>
    public required string ProductName { get; init; }

    /// <summary>
    /// Stock-keeping unit code.
    /// </summary>
    public required string SKU { get; init; }

    /// <summary>
    /// Total units issued (dispatched) for this product within the reporting window.
    /// Only movements with type <c>Issue</c> and status <c>Active</c> or <c>Approved</c>
    /// are counted.
    /// </summary>
    public required decimal TotalUnitsIssued { get; init; }

    /// <summary>
    /// Average stock level used as the denominator of the turnover ratio.
    /// Computed as the current on-hand quantity across all stock locations
    /// (a point-in-time snapshot taken at query time).
    /// </summary>
    public required decimal AverageStockLevel { get; init; }

    /// <summary>
    /// Annualised inventory turnover ratio: <c>(TotalUnitsIssued / AverageStockLevel) × (365 / DaysInPeriod)</c>.
    /// Rounded to four decimal places.
    /// </summary>
    public required decimal TurnoverRatio { get; init; }

    /// <summary>
    /// Movement classification based on the annualised turnover ratio:
    /// <list type="bullet">
    ///   <item><c>FastMoving</c> — ratio &gt; 12 turns per year.</item>
    ///   <item><c>SlowMoving</c> — ratio &lt; 2 turns per year.</item>
    ///   <item><c>Normal</c>     — ratio between 2 and 12 (inclusive).</item>
    /// </list>
    /// </summary>
    public required string Classification { get; init; }
}
