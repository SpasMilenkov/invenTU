namespace InvenTU.Core.DTOs.Stock;

public sealed class StockItemDto
{
    public Guid Id { get; init; }
    public Guid ProductId { get; init; }
    public string ProductName { get; init; } = string.Empty;
    public string ProductSku { get; init; } = string.Empty;
    public Guid StockLocationId { get; init; }
    public string FullLocationCode { get; init; } = string.Empty;
    public Guid WarehouseId { get; init; }
    public string WarehouseName { get; init; } = string.Empty;
    public decimal Quantity { get; init; }
    public decimal QuantityReserved { get; init; }
    public decimal QuantityAvailable { get; init; }
}
