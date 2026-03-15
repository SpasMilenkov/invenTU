using InvenTU.Core.Enums;

namespace InvenTU.Core.Entities;

public sealed class StockMovement
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public Guid WarehouseId { get; set; }
    public Guid? DestinationWarehouseId { get; set; }
    public Guid? UserId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitCost { get; set; }
    public MovementType MovementType { get; set; }
    public string? ReferenceNumber { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }

    public Product Product { get; set; } = null!;
    public Warehouse Warehouse { get; set; } = null!;
    public Warehouse? DestinationWarehouse { get; set; }
    public User? User { get; set; }
}
