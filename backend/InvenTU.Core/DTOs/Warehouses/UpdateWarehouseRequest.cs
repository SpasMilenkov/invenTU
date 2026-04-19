namespace InvenTU.Core.DTOs.Warehouses;

public sealed class UpdateWarehouseRequest
{
    public string Name { get; init; } = string.Empty;
    public string? Location { get; init; }
    public int Capacity { get; init; }
}
