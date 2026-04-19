using InvenTU.Core.DTOs.Stock;

namespace InvenTU.Core.Contracts.Services;

public interface IStockTransferService
{
    Task<StockTransferDto> TransferAsync(TransferStockRequest request, CancellationToken cancellationToken = default);
}
