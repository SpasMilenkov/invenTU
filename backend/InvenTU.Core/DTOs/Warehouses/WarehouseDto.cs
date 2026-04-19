namespace InvenTU.Core.DTOs.Warehouses;

public sealed class WarehouseDto
{
    public Guid Id { get; init; }
    public string Code { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public bool IsActive { get; init; }
    public string? Location { get; init; }
    public int? MaxStockLevel { get; init; }
    public int TotalLocations { get; init; }
    public int TotalStockItems { get; init; }
    public decimal TotalQuantity { get; init; }
}
