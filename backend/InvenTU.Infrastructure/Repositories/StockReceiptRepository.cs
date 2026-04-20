using InvenTU.Core.Contracts.Repositories;
using InvenTU.Core.Entities;
using InvenTU.Core.Enums;
using InvenTU.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InvenTU.Infrastructure.Repositories;

public sealed class StockReceiptRepository(InvenTUDbContext dbContext) : IStockReceiptRepository
{
    public async Task<(Guid MovementId, decimal UpdatedStockLevel)> ExecuteAsync(
        Guid productId,
        Guid stockLocationId,
        Guid warehouseId,
        decimal quantity,
        Guid userId,
        string? referenceNumber,
        string? notes,
        CancellationToken cancellationToken = default)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var stockItem = await dbContext.StockItems
            .Where(si => si.ProductId == productId && si.StockLocationId == stockLocationId)
            .FirstOrDefaultAsync(cancellationToken);

        if (stockItem is null)
        {
            stockItem = new StockItem
            {
                Id = Guid.NewGuid(),
                ProductId = productId,
                StockLocationId = stockLocationId,
                Quantity = quantity,
                QuantityReserved = 0m,
            };
            dbContext.StockItems.Add(stockItem);
        }
        else
        {
            stockItem.Quantity += quantity;
        }

        var movement = new StockMovement
        {
            Id = Guid.NewGuid(),
            ProductId = productId,
            DestinationWarehouseId = warehouseId,
            StockLocationId = stockLocationId,
            MovementType = MovementType.Receipt,
            Quantity = quantity,
            Status = MovementStatus.Active,
            CreatedAt = DateTime.UtcNow,
            UserId = userId,
            ReferenceNumber = referenceNumber,
            Notes = notes,
        };
        dbContext.StockMovements.Add(movement);

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return (movement.Id, stockItem.Quantity);
    }
}
