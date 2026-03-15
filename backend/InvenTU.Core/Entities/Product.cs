namespace InvenTU.Core.Entities;

public sealed class Product
{
    public Guid Id { get; set; }
    public Guid CategoryId { get; set; }
    public Guid WarehouseId { get; set; }
    // Stock Keeping Unit, human-readable product code
    public string SKU { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string Description { get; set; } = null!;
    public decimal UnitPrice { get; set; }
    public decimal CostPrice { get; set; }
    public string UnitOfMeasure { get; set; } = null!;
    public string Barcode { get; set; } = null!;
    public int MinStockLevel { get; set; }
    public int MaxStockLevel { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Category Category { get; set; } = null!;
    public Warehouse Warehouse { get; set; } = null!;
}
