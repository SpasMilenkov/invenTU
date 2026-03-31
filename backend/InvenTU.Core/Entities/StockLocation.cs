namespace InvenTU.Core.Entities;

public sealed class StockLocation
{
    public Guid Id { get; set; }
    public Guid WarehouseId { get; set; }
    public string Zone { get; set; } = string.Empty;
    public string? Aisle { get; set; }
    public string? Shelf { get; set; }
    public string? Bin { get; set; }
    public int MaxCapacity { get; set; }

    public Warehouse Warehouse { get; set; } = null!;
    public ICollection<StockItem> StockItems { get; set; } = [];
}
