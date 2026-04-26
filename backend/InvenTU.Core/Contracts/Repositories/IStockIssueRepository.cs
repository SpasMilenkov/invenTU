namespace InvenTU.Core.Contracts.Repositories;

/// <summary>
/// Repository responsible for atomically executing a stock issue operation
/// and persisting the corresponding <c>StockMovement</c> audit record.
/// </summary>
public interface IStockIssueRepository
{
    /// <summary>
    /// Deducts <paramref name="quantity"/> from available stock at the specified
    /// location and writes a <c>StockMovement</c> record of type <c>Issue</c>.
    /// The operation is wrapped in a database transaction; a concurrency conflict
    /// on the <c>StockItem</c> row version will surface as a
    /// <c>StockConflictException</c>.
    /// </summary>
    /// <param name="productId">The product whose stock is being issued.</param>
    /// <param name="stockLocationId">The bin/shelf location stock is issued from.</param>
    /// <param name="warehouseId">The warehouse that owns the stock location.</param>
    /// <param name="quantity">The positive quantity to issue.</param>
    /// <param name="userId">The identifier of the user performing the issue.</param>
    /// <param name="reasonCode">A short code describing why the stock is being issued.</param>
    /// <param name="referenceNumber">
    /// An optional external reference (e.g. a work-order or sales-order number)
    /// stored on the movement record for traceability.
    /// </param>
    /// <param name="notes">Optional free-text notes to attach to the movement record.</param>
    /// <param name="cancellationToken">Token used to propagate cancellation.</param>
    /// <returns>
    /// A tuple of the new movement's <c>Guid</c> and the stock level at the
    /// location after the deduction.
    /// </returns>
    Task<(Guid MovementId, decimal UpdatedStockLevel)> ExecuteAsync(
        Guid productId,
        Guid stockLocationId,
        Guid warehouseId,
        decimal quantity,
        Guid userId,
        string reasonCode,
        string? referenceNumber,
        string? notes,
        CancellationToken cancellationToken = default);
}
