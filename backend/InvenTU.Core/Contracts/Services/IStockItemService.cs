using InvenTU.Core.DTOs.Stock;

namespace InvenTU.Core.Contracts.Services;

public interface IStockItemService
{
    Task<IReadOnlyList<StockItemDto>> GetStockAsync(StockQueryParams query, CancellationToken cancellationToken = default);
    Task<StockSummaryDto> GetSummaryAsync(Guid productId, CancellationToken cancellationToken = default);
}
