namespace InvenTU.Core.DTOs.Stock;

public sealed class StockIssueDto
{
    public Guid MovementId { get; init; }
    public Guid ProductId { get; init; }
    public string ProductName { get; init; } = string.Empty;
    public Guid WarehouseId { get; init; }
    public string WarehouseName { get; init; } = string.Empty;
    public Guid StockLocationId { get; init; }
    public decimal Quantity { get; init; }
    public decimal UpdatedStockLevel { get; init; }
    public string ReasonCode { get; init; } = string.Empty;
    public string? Notes { get; init; }
    public DateTime CreatedAt { get; init; }
}
