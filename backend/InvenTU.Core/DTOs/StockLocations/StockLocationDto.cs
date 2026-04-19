namespace InvenTU.Core.DTOs.StockLocations;

public sealed class StockLocationDto
{
    public Guid Id { get; init; }
    public Guid WarehouseId { get; init; }
    public string Zone { get; init; } = string.Empty;
    public string? Aisle { get; init; }
    public string? Shelf { get; init; }
    public string? Bin { get; init; }
    public int MaxCapacity { get; init; }
    public string FullLocationCode { get; init; } = string.Empty;
    public int StockItemCount { get; init; }
    public decimal TotalQuantity { get; init; }
}
