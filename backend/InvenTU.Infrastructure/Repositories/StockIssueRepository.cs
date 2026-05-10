using InvenTU.Core.Contracts.Repositories;
using InvenTU.Core.Entities;
using InvenTU.Core.Enums;
using InvenTU.Core.Exceptions;
using InvenTU.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InvenTU.Infrastructure.Repositories;

/// <summary>
/// EF Core implementation of <see cref="IStockIssueRepository"/>.
/// Executes the issue operation and its audit record inside a single
/// database transaction with optimistic-concurrency protection.
/// </summary>
public sealed class StockIssueRepository(InvenTUDbContext dbContext) : IStockIssueRepository
{
    /// <inheritdoc/>
    public async Task<(Guid MovementId, decimal UpdatedStockLevel)> ExecuteAsync(
        Guid productId,
        Guid stockLocationId,
        Guid warehouseId,
        decimal quantity,
        Guid userId,
        string reasonCode,
        string? referenceNumber,
        string? notes,
        CancellationToken cancellationToken = default)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var productName = await dbContext.Products
            .Where(p => p.Id == productId)
            .Select(p => p.Name)
            .FirstOrDefaultAsync(cancellationToken) ?? "Unknown";

        var stockItem = await dbContext.StockItems
            .Where(si => si.ProductId == productId && si.StockLocationId == stockLocationId)
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new InsufficientStockException(productName, quantity, 0m);

        stockItem.Issue(quantity, productName);

        var movement = new StockMovement
        {
            Id = Guid.NewGuid(),
            ProductId = productId,
            SourceWarehouseId = warehouseId,
            StockLocationId = stockLocationId,
            MovementType = MovementType.Issue,
            Quantity = quantity,
            Status = MovementStatus.Active,
            CreatedAt = DateTime.UtcNow,
            UserId = userId,
            ReasonCode = reasonCode,
            ReferenceNumber = referenceNumber,
            Notes = notes,
        };
        dbContext.StockMovements.Add(movement);

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new StockConflictException();
        }

        await transaction.CommitAsync(cancellationToken);

        return (movement.Id, stockItem.Quantity);
    }
}
