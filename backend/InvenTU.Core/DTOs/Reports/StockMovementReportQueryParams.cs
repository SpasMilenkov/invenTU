namespace InvenTU.Core.DTOs.Reports;

/// <summary>
/// Query parameters accepted by <c>GET /api/v1/reports/stock-movement/pdf</c>.
/// All filters are optional and combined with AND logic.
/// When <see cref="FromDate"/> is omitted the endpoint defaults to 30 days before <see cref="ToDate"/>.
/// When <see cref="ToDate"/> is omitted it defaults to the current UTC timestamp.
/// </summary>
public sealed class StockMovementReportQueryParams
{
    /// <summary>
    /// Start of the reporting window (UTC, inclusive).
    /// Defaults to <c>ToDate − 30 days</c> when not supplied.
    /// </summary>
    public DateTime? FromDate { get; init; }

    /// <summary>
    /// End of the reporting window (UTC, inclusive).
    /// Defaults to the current UTC timestamp when not supplied.
    /// </summary>
    public DateTime? ToDate { get; init; }

    /// <summary>
    /// Restrict to movements where this warehouse appears as either
    /// the source <em>or</em> the destination.
    /// </summary>
    public Guid? WarehouseId { get; init; }

    /// <summary>
    /// Restrict to a specific movement type.
    /// Accepted values (case-insensitive): <c>Receipt</c>, <c>Issue</c>,
    /// <c>Transfer</c>, <c>Adjustment</c>, <c>Count</c>, <c>WriteOff</c>.
    /// Unrecognised values are silently ignored (treated as no filter).
    /// </summary>
    public string? MovementType { get; init; }

    /// <summary>
    /// Restrict to a specific movement status.
    /// Accepted values (case-insensitive): <c>Active</c>, <c>Approved</c>,
    /// <c>Pending</c>, <c>Cancelled</c>.
    /// Unrecognised values are silently ignored (treated as no filter).
    /// </summary>
    public string? Status { get; init; }

    /// <summary>
    /// Restrict to movements for a specific product.
    /// </summary>
    public Guid? ProductId { get; init; }
}

