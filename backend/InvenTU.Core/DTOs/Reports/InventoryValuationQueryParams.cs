namespace InvenTU.Core.DTOs.Reports;

/// <summary>
/// Optional filters for <c>GET /api/v1/reports/inventory-valuation</c>.
/// </summary>
public sealed class InventoryValuationQueryParams
{
    /// <summary>
    /// Restrict valuation to stock held in this warehouse.
    /// </summary>
    public Guid? WarehouseId { get; init; }

    /// <summary>
    /// Restrict valuation to products belonging to this category.
    /// </summary>
    public Guid? CategoryId { get; init; }
}
