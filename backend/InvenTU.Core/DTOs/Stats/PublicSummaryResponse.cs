namespace InvenTU.Core.DTOs.Stats;

public sealed class PublicSummaryResponse
{
    public int ActiveWarehouses { get; init; }
    public int ActiveSkus { get; init; }
    public int StockLocations { get; init; }
}
