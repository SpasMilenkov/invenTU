namespace InvenTU.Core.DTOs.Warehouses;

public sealed class CreateWarehouseRequest
{
    public string Code { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string? Location { get; init; }
    public int Capacity { get; init; }
    public bool IsActive { get; init; } = true;
}
