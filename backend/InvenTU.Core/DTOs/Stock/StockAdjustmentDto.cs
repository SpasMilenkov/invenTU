namespace InvenTU.Core.DTOs.Stock;

public sealed class StockAdjustmentDto
{
    public Guid MovementId { get; init; }
    public Guid ProductId { get; init; }
    public string ProductName { get; init; } = string.Empty;
    public Guid StockLocationId { get; init; }
    public string FullLocationCode { get; init; } = string.Empty;
    public Guid WarehouseId { get; init; }
    public string WarehouseName { get; init; } = string.Empty;
    public decimal PreviousQuantity { get; init; }
    public decimal CountedQuantity { get; init; }
    public decimal Delta { get; init; }
    public string Status { get; init; } = string.Empty;
    public string? Notes { get; init; }
    public string? ReferenceNumber { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? ReviewedAt { get; init; }
}
