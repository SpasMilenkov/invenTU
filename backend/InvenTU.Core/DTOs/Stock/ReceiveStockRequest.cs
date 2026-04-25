namespace InvenTU.Core.DTOs.Stock;

public sealed class ReceiveStockRequest
{
    public Guid WarehouseId { get; init; }
    public Guid StockLocationId { get; init; }
    public Guid ProductId { get; init; }
    public decimal Quantity { get; init; }
    public string? ReferenceNumber { get; init; }
    public string? Notes { get; init; }
}
