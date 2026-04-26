using InvenTU.Core.Contracts.Repositories;
using InvenTU.Core.Entities;
using InvenTU.Core.Enums;
using InvenTU.Core.Exceptions;
using InvenTU.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InvenTU.Infrastructure.Repositories;
/// <summary>
/// EF Core implementation of <see cref="IStockTransferRepository"/>.
/// Executes the transfer operation — deducting from the source, crediting the
/// destination, and writing the audit record — inside a single database
/// transaction with optimistic-concurrency protection on both
/// <c>StockItem</c> rows.
/// </summary>
public sealed class StockTransferRepository(InvenTUDbContext dbContext) : IStockTransferRepository
{
    /// <inheritdoc/>
    public async Task<Guid> ExecuteAsync(
        Guid productId,
        Guid sourceLocationId,
        Guid sourceWarehouseId,
        Guid destinationLocationId,
        Guid destinationWarehouseId,
        decimal quantity,
        Guid userId,
        string? reasonCode,
        string? referenceNumber,
        string? notes,
        CancellationToken cancellationToken = default)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var productName = await dbContext.Products
            .Where(p => p.Id == productId)
            .Select(p => p.Name)
            .FirstOrDefaultAsync(cancellationToken) ?? "Unknown";

        var sourceItem = await dbContext.StockItems
            .Where(si => si.ProductId == productId && si.StockLocationId == sourceLocationId)
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new InsufficientStockException(productName, quantity, 0m);

        sourceItem.Deduct(quantity, productName);

        var destItem = await dbContext.StockItems
            .Where(si => si.ProductId == productId && si.StockLocationId == destinationLocationId)
            .FirstOrDefaultAsync(cancellationToken);

        if (destItem is null)
        {
            destItem = new StockItem
            {
                Id = Guid.NewGuid(),
                ProductId = productId,
                StockLocationId = destinationLocationId,
                Quantity = quantity,
                QuantityReserved = 0m,
            };
            dbContext.StockItems.Add(destItem);
        }
        else
        {
            destItem.Quantity += quantity;
        }

        var movement = new StockMovement
        {
            Id = Guid.NewGuid(),
            ProductId = productId,
            SourceWarehouseId = sourceWarehouseId,
            DestinationWarehouseId = destinationWarehouseId,
            StockLocationId = destinationLocationId,
            MovementType = MovementType.Transfer,
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

        return movement.Id;
    }
}
