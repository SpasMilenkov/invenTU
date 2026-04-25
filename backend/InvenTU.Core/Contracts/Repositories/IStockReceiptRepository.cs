namespace InvenTU.Core.Contracts.Repositories;

public interface IStockReceiptRepository
{
    /// <summary>
    /// Atomically upserts the <see cref="InvenTU.Core.Entities.StockItem"/> for the target
    /// location and creates a Receipt <see cref="InvenTU.Core.Entities.StockMovement"/> record.
    /// </summary>
    /// <returns>
    /// A tuple containing the ID of the created movement and the updated stock level
    /// at the target location after the receipt.
    /// </returns>
    Task<(Guid MovementId, decimal UpdatedStockLevel)> ExecuteAsync(
        Guid productId,
        Guid stockLocationId,
        Guid warehouseId,
        decimal quantity,
        Guid userId,
        string? referenceNumber,
        string? notes,
        CancellationToken cancellationToken = default);
}
