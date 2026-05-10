namespace InvenTU.Core.DTOs.Stats;

/// <summary>
/// Breakdown of purchase order activity returned by <c>GET /api/v1/stats/purchase-order-pipeline</c>.
/// "Open" orders are those not yet in a terminal status (<c>Received</c> or <c>Cancelled</c>).
/// </summary>
public sealed record PurchaseOrderPipelineResponse
{
    /// <summary>
    /// Count of purchase orders that are currently in a non-terminal status,
    /// i.e. excluding orders with status <c>Received</c> or <c>Cancelled</c>.
    /// </summary>
    public required int TotalOpenOrders { get; init; }

    /// <summary>
    /// Total outstanding financial commitment across all open orders, calculated as
    /// <c>SUM(PurchaseOrderLines.Quantity × PurchaseOrderLines.UnitPrice)</c>
    /// for every line belonging to a non-terminal purchase order.
    /// </summary>
    public required decimal TotalOpenValue { get; init; }

    /// <summary>
    /// Distribution of all purchase orders (including terminal ones) keyed by status string.
    /// Provides a full-funnel view — e.g. <c>{ "Pending": 3, "Approved": 2, "Received": 14, "Cancelled": 1 }</c>.
    /// </summary>
    public required Dictionary<string, int> ByStatus { get; init; }
}
