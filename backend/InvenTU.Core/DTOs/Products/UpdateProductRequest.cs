namespace InvenTU.Core.DTOs.Products;

public sealed class UpdateProductRequest
{
    public string Name { get; init; } = string.Empty;
    public Guid CategoryId { get; init; }
    public Guid? PrimaryWarehouseId { get; init; }
    public decimal UnitPrice { get; init; }
    public decimal CostPrice { get; init; }
    public string UnitOfMeasure { get; init; } = string.Empty;
    public bool IsActive { get; init; }
    public string? Description { get; init; }
    public string? Barcode { get; init; }
    public int MinStockLevel { get; init; }
    public int? MaxStockLevel { get; init; }
    public int ReorderPoint { get; init; }
}
