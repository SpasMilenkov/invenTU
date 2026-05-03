namespace InvenTU.Core.Entities;

public sealed class Product
{
    public Guid Id { get; set; }
    public Guid CategoryId { get; set; }
    public Guid? PrimaryWarehouseId { get; set; }
    public string SKU { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public decimal CostPrice { get; set; }
    public string UnitOfMeasure { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public string? Description { get; set; }
    public string? Barcode { get; set; }
    public int MinStockLevel { get; set; }
    public int? MaxStockLevel { get; set; }
    public int ReorderPoint { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? DeletedAt { get; set; }

    public Category Category { get; set; } = null!;
    public Warehouse? PrimaryWarehouse { get; set; }
    public ICollection<StockItem> StockItems { get; set; } = [];
    public ICollection<StockMovement> StockMovements { get; set; } = [];
    public ICollection<ProductSupplier> ProductSuppliers { get; set; } = [];
    public ICollection<Supplier> Suppliers { get; set; } = [];
}
