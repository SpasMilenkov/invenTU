namespace InvenTU.Core.DTOs.Reports;

/// <summary>
/// Response envelope for the inventory-valuation report.
/// </summary>
public sealed record InventoryValuationResponse
{
    /// <summary>
    /// Per-product valuation rows, ordered by SKU ascending.
    /// </summary>
    public required IReadOnlyList<ProductValuationDto> Items { get; init; }

    /// <summary>
    /// Sum of all <see cref="ProductValuationDto.TotalValue"/> entries.
    /// </summary>
    public required decimal GrandTotal { get; init; }

    /// <summary>
    /// Warehouse filter applied, or <c>null</c> if no warehouse was specified.
    /// </summary>
    public Guid? WarehouseId { get; init; }

    /// <summary>
    /// Category filter applied, or <c>null</c> if no category was specified.
    /// </summary>
    public Guid? CategoryId { get; init; }
}
