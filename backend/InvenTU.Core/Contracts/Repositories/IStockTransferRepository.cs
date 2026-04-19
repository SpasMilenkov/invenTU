namespace InvenTU.Core.Contracts.Repositories;

public interface IStockTransferRepository
{
    /// <summary>
    /// Atomically moves <paramref name="quantity"/> units of <paramref name="productId"/>
    /// from <paramref name="sourceLocationId"/> to <paramref name="destinationLocationId"/>,
    /// creating a Transfer stock movement record in the process.
    /// </summary>
    /// <returns>The ID of the created <c>StockMovement</c> record.</returns>
    Task<Guid> ExecuteAsync(
        Guid productId,
        Guid sourceLocationId,
        Guid sourceWarehouseId,
        Guid destinationLocationId,
        Guid destinationWarehouseId,
        decimal quantity,
        Guid userId,
        string? notes,
        CancellationToken cancellationToken = default);
}
