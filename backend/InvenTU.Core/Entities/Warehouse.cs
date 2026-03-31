namespace InvenTU.Core.Entities;

public sealed class Warehouse
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public string? Location { get; set; }
    public int Capacity { get; set; }

    public ICollection<StockLocation> StockLocations { get; set; } = [];
    public ICollection<StockMovement> SourceMovements { get; set; } = [];
    public ICollection<StockMovement> DestinationMovements { get; set; } = [];
}
