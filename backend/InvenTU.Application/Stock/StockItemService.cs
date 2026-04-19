using InvenTU.Core.Contracts.Repositories;
using InvenTU.Core.Contracts.Services;
using InvenTU.Core.DTOs.Stock;
using InvenTU.Core.Exceptions;

namespace InvenTU.Application.Stock;

public sealed class StockItemService(IStockItemRepository stockItemRepository) : IStockItemService
{
    public Task<IReadOnlyList<StockItemDto>> GetStockAsync(StockQueryParams query, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(query);
        return stockItemRepository.GetStockAsync(query, cancellationToken);
    }

    public async Task<StockSummaryDto> GetSummaryAsync(Guid productId, CancellationToken cancellationToken = default)
    {
        return await stockItemRepository.GetSummaryByProductAsync(productId, cancellationToken) ?? throw new ProductNotFoundException(productId);
    }
}
