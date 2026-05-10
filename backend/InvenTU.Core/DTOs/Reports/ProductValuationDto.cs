namespace InvenTU.Core.DTOs.Reports;

/// <summary>
/// FIFO-based stock valuation row for a single product.
/// </summary>
public sealed record ProductValuationDto
{
    public required Guid ProductId { get; init; }
    public required string SKU { get; init; }
    public required string Name { get; init; }
    public required string Category { get; init; }

    /// <summary>
    /// Total on-hand quantity across all applicable stock locations.
    /// </summary>
    public required decimal TotalQuantity { get; init; }

    /// <summary>
    /// FIFO-derived unit cost; falls back to <c>Product.CostPrice</c> when no purchase order data exists.
    /// </summary>
    public required decimal UnitCost { get; init; }

    /// <summary>
    /// <c>TotalQuantity × UnitCost</c>, rounded to two decimal places.
    /// </summary>
    public required decimal TotalValue { get; init; }
}
