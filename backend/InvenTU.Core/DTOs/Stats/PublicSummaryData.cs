namespace InvenTU.Core.DTOs.Stats;

public sealed record PublicSummaryData(
    int ActiveWarehouses,
    int ActiveSkus,
    int StockLocations);
