namespace InvenTU.Core.DTOs.Stock;

public sealed class WarehouseStockSummaryDto
{
    public Guid WarehouseId { get; init; }
    public string WarehouseName { get; init; } = string.Empty;
    public decimal Quantity { get; init; }
    public decimal QuantityReserved { get; init; }
    public decimal QuantityAvailable { get; init; }
}
