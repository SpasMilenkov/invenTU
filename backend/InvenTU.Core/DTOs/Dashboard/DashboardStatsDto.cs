namespace InvenTU.Core.DTOs.Dashboard;

/// <summary>
/// Aggregated statistics returned by <c>GET /api/v1/dashboard/stats</c>.
/// All metrics are computed in a minimal number of database round-trips and
/// reflect the current state of the inventory at the moment of the request.
/// </summary>
public sealed class DashboardStatsDto
{
    /// <summary>
    /// The number of active (non-deleted, <c>IsActive = true</c>) products
    /// currently in the system.
    /// </summary>
    public int TotalProducts { get; init; }

    /// <summary>The number of warehouses whose <c>IsActive</c> flag is <c>true</c>.</summary>
    public int TotalWarehouses { get; init; }

    /// <summary>
    /// The number of active products whose total quantity across all stock
    /// locations is strictly below their configured <c>MinStockLevel</c>.
    /// Products with <c>MinStockLevel = 0</c> are never counted as low-stock.
    /// </summary>
    public int LowStockCount { get; init; }

    /// <summary>
    /// The total monetary value of all stock on hand, calculated as the sum of
    /// <c>totalStockQuantity × CostPrice</c> for every active, non-deleted product.
    /// Products with no stock items contribute zero to this figure.
    /// </summary>
    public decimal TotalStockValue { get; init; }

    /// <summary>
    /// The ten most recently created stock movements, each enriched with the
    /// associated product name and SKU. Ordered newest-first.
    /// </summary>
    public IReadOnlyList<RecentMovementDto> RecentMovements { get; init; }
        = [];

    /// <summary>
    /// The top eight product categories ranked by total stock quantity (descending).
    /// Only stock belonging to active, non-deleted products is included.
    /// </summary>
    public IReadOnlyList<StockByCategoryDto> StockByCategory { get; init; }
        = [];
}
