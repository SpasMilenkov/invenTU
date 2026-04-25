using InvenTU.Core.DTOs.Stock;
using InvenTU.Core.Enums;

namespace InvenTU.Core.Contracts.Repositories;

public interface IStockAdjustmentRepository
{
    /// <summary>
    /// Atomically determines the current stock level, applies the approval threshold,
    /// creates a <see cref="InvenTU.Core.Entities.StockMovement"/> of type Adjustment,
    /// and updates the <see cref="InvenTU.Core.Entities.StockItem"/> if auto-approved.
    /// </summary>
    Task<(Guid MovementId, decimal PreviousQuantity, MovementStatus Status)> SubmitAsync(
        Guid productId,
        Guid stockLocationId,
        Guid warehouseId,
        decimal countedQuantity,
        decimal approvalThreshold,
        Guid userId,
        string? referenceNumber,
        string? notes,
        CancellationToken cancellationToken = default);

    Task<StockAdjustmentDto?> GetAsync(Guid movementId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<StockAdjustmentDto>> GetPendingAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Approves a PendingApproval adjustment, updating the StockItem to the counted quantity.
    /// Throws <see cref="InvenTU.Core.Exceptions.StockAdjustmentNotFoundException"/> if not found.
    /// Throws <see cref="InvenTU.Core.Exceptions.StockAdjustmentNotPendingException"/> if not pending.
    /// </summary>
    Task ApproveAsync(Guid movementId, Guid reviewedByUserId, string? reason, CancellationToken cancellationToken = default);

    /// <summary>
    /// Rejects a PendingApproval adjustment without changing stock levels.
    /// Throws <see cref="InvenTU.Core.Exceptions.StockAdjustmentNotFoundException"/> if not found.
    /// Throws <see cref="InvenTU.Core.Exceptions.StockAdjustmentNotPendingException"/> if not pending.
    /// </summary>
    Task RejectAsync(Guid movementId, Guid reviewedByUserId, string? reason, CancellationToken cancellationToken = default);
}
