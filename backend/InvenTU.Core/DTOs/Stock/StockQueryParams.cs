namespace InvenTU.Core.DTOs.Stock;

public sealed class StockQueryParams
{
    public Guid? ProductId { get; init; }
    public Guid? WarehouseId { get; init; }
    public bool ExcludeZeroStock { get; init; } = false;
}
