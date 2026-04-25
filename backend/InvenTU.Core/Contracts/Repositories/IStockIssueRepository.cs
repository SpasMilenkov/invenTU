namespace InvenTU.Core.Contracts.Repositories;

public interface IStockIssueRepository
{
    /// <summary>
    /// Atomically decrements the <see cref="InvenTU.Core.Entities.StockItem"/> quantity for the
    /// given location and records an Issue <see cref="InvenTU.Core.Entities.StockMovement"/>.
    /// Throws <see cref="InvenTU.Core.Exceptions.InsufficientStockException"/> (HTTP 422) when
    /// available stock (Quantity − QuantityReserved) is less than <paramref name="quantity"/>.
    /// </summary>
    /// <returns>
    /// A tuple containing the ID of the created movement and the remaining stock level
    /// at the location after the issue.
    /// </returns>
    Task<(Guid MovementId, decimal UpdatedStockLevel)> ExecuteAsync(
        Guid productId,
        Guid stockLocationId,
        Guid warehouseId,
        decimal quantity,
        Guid userId,
        string reasonCode,
        string? notes,
        CancellationToken cancellationToken = default);
}
