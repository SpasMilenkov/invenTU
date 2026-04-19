namespace InvenTU.Core.DTOs.Stock;

public sealed class StockTransferDto
{
    public Guid MovementId { get; init; }
    public Guid ProductId { get; init; }
    public string ProductName { get; init; } = string.Empty;
    public Guid SourceWarehouseId { get; init; }
    public string SourceWarehouseName { get; init; } = string.Empty;
    public Guid DestinationWarehouseId { get; init; }
    public string DestinationWarehouseName { get; init; } = string.Empty;
    public decimal Quantity { get; init; }
    public DateTime CreatedAt { get; init; }
}
