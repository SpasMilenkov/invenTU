using InvenTU.Core.DTOs.Stock;

namespace InvenTU.Core.Contracts.Services;

public interface IStockReceiptService
{
    Task<StockReceiptDto> ReceiveAsync(ReceiveStockRequest request, CancellationToken cancellationToken = default);
}
