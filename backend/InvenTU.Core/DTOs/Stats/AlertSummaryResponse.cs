namespace InvenTU.Core.DTOs.Stats;

/// <summary>
/// Summary of currently active (unresolved) alerts returned by <c>GET /api/v1/stats/alerts</c>.
/// The <c>UnreadForCurrentUser</c> count is personalised to the authenticated caller.
/// </summary>
public sealed record AlertSummaryResponse
{
    /// <summary>
    /// Total number of alerts whose <c>ResolvedAt</c> timestamp is <c>NULL</c>,
    /// i.e. alerts that are still open across all users and warehouses.
    /// </summary>
    public required int TotalUnresolved { get; init; }

    /// <summary>
    /// Number of unresolved alerts that the calling user has not yet read.
    /// Derived from alerts that have no corresponding <c>AlertUserStates</c> row
    /// with <c>IsRead = true</c> for the current user's id.
    /// </summary>
    public required int UnreadForCurrentUser { get; init; }

    /// <summary>
    /// Breakdown of unresolved alert counts keyed by <c>AlertType</c>.
    /// Each entry maps an alert-type string (e.g. <c>"LowStock"</c>, <c>"OutOfStock"</c>)
    /// to the number of open alerts of that type.
    /// </summary>
    public required Dictionary<string, int> ByType { get; init; }
}
