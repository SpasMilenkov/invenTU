using InvenTU.Core.Enums;

namespace InvenTU.Core.Entities;

public sealed class Alert
{
    public Guid Id { get; set; }
    public Guid? ProductId { get; set; }
    public Guid? StockLocationId { get; set; }
    public Guid? WarehouseId { get; set; }
    public AlertType AlertType { get; set; }
    public DateTime CreatedAt { get; set; }
    public decimal? CurrentQuantity { get; set; }
    public int? MinStockLevel { get; set; }
    public decimal? ReorderSuggestion { get; set; }
    public DateTime? ResolvedAt { get; set; }

    public Product? Product { get; set; }
    public StockLocation? StockLocation { get; set; }
    public Warehouse? Warehouse { get; set; }
    public ICollection<AlertUserState> AlertUserStates { get; set; } = [];
}
