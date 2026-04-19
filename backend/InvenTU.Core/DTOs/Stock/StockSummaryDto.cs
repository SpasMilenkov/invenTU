namespace InvenTU.Core.DTOs.Stock;

public sealed class StockSummaryDto
{
    public Guid ProductId { get; init; }
    public string ProductName { get; init; } = string.Empty;
    public string ProductSku { get; init; } = string.Empty;
    public decimal TotalQuantity { get; init; }
    public decimal TotalQuantityReserved { get; init; }
    public decimal TotalQuantityAvailable { get; init; }
    public int WarehouseCount { get; init; }
    public IReadOnlyList<WarehouseStockSummaryDto> ByWarehouse { get; init; } = [];
}
