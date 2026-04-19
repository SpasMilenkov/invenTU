namespace InvenTU.Core.DTOs.Stock;

public sealed class TransferStockRequest
{
    public Guid SourceWarehouseId { get; init; }
    public Guid SourceStockLocationId { get; init; }
    public Guid DestinationWarehouseId { get; init; }
    public Guid DestinationStockLocationId { get; init; }
    public Guid ProductId { get; init; }
    public decimal Quantity { get; init; }
    public string? Notes { get; init; }
}
