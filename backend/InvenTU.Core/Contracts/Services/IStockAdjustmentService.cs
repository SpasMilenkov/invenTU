using InvenTU.Core.DTOs.Stock;

namespace InvenTU.Core.Contracts.Services;

public interface IStockAdjustmentService
{
    Task<StockAdjustmentDto> SubmitAsync(AdjustStockRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<StockAdjustmentDto>> GetPendingAsync(CancellationToken cancellationToken = default);
    Task<StockAdjustmentDto> ApproveAsync(Guid movementId, ReviewAdjustmentRequest request, CancellationToken cancellationToken = default);
    Task<StockAdjustmentDto> RejectAsync(Guid movementId, ReviewAdjustmentRequest request, CancellationToken cancellationToken = default);
}
