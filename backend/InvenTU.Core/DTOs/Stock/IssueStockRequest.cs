namespace InvenTU.Core.DTOs.Stock;

public sealed class IssueStockRequest
{
    public Guid WarehouseId { get; init; }
    public Guid StockLocationId { get; init; }
    public Guid ProductId { get; init; }
    public decimal Quantity { get; init; }
    public string ReasonCode { get; init; } = string.Empty;
    public string? Notes { get; init; }
}
