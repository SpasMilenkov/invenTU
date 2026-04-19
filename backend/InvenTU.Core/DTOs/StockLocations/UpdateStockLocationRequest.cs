namespace InvenTU.Core.DTOs.StockLocations;

public sealed class UpdateStockLocationRequest
{
    public string Zone { get; init; } = string.Empty;
    public string? Aisle { get; init; }
    public string? Shelf { get; init; }
    public string? Bin { get; init; }
    public int MaxCapacity { get; init; }
}
