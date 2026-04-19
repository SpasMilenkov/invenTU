using InvenTU.Core.DTOs.Stock;

namespace InvenTU.Core.Contracts.Repositories;

public interface IStockItemRepository
{
    Task<IReadOnlyList<StockItemDto>> GetStockAsync(StockQueryParams query, CancellationToken cancellationToken = default);
    Task<StockSummaryDto?> GetSummaryByProductAsync(Guid productId, CancellationToken cancellationToken = default);
}
