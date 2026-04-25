using InvenTU.Core.Enums;

namespace InvenTU.Core.Entities;

public sealed class StockMovement
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public Guid? SourceWarehouseId { get; set; }
    public Guid? DestinationWarehouseId { get; set; }
    public Guid? StockLocationId { get; set; }
    public MovementType MovementType { get; set; }
    public decimal Quantity { get; set; }
    public MovementStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public Guid UserId { get; set; }
    public string? ReasonCode { get; set; }
    public string? ReferenceNumber { get; set; }
    public string? Notes { get; set; }

    public decimal? CountedQuantity { get; set; }
    public Guid? ReviewedByUserId { get; set; }
    public DateTime? ReviewedAt { get; set; }

    public Product Product { get; set; } = null!;
    public User User { get; set; } = null!;
    public User? ReviewedByUser { get; set; }
    public Warehouse? SourceWarehouse { get; set; }
    public Warehouse? DestinationWarehouse { get; set; }
    public StockLocation? StockLocation { get; set; }
}
