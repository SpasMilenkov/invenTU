namespace InvenTU.Core.DTOs.Stats;

/// <summary>
/// Snapshot of overall inventory health returned by <c>GET /api/v1/stats/inventory-health</c>.
/// </summary>
public sealed record InventoryHealthResponse
{
    /// <summary>
    /// Total number of products that are active and have not been soft-deleted.
    /// Counts rows in <c>Products</c> where <c>IsActive = true</c> and <c>DeletedAt IS NULL</c>.
    /// </summary>
    public required int TotalActiveProducts { get; init; }

    /// <summary>
    /// Aggregated monetary value of all on-hand stock, calculated as
    /// <c>SUM(StockItems.Quantity × Products.CostPrice)</c> across every stock location.
    /// </summary>
    public required decimal TotalStockValue { get; init; }

    /// <summary>
    /// Number of active products whose total quantity across all stock locations is at or
    /// below their configured <c>ReorderPoint</c>. These products need replenishment attention.
    /// </summary>
    public required int ProductsBelowReorderPoint { get; init; }

    /// <summary>
    /// Total units currently on hand across all stock locations,
    /// i.e. <c>SUM(StockItems.Quantity)</c>.
    /// </summary>
    public required decimal TotalStockUnits { get; init; }

    /// <summary>
    /// Total number of bin-level stock locations (zone / aisle / shelf / bin combinations)
    /// registered across all warehouses.
    /// </summary>
    public required int TotalStockLocations { get; init; }
}
