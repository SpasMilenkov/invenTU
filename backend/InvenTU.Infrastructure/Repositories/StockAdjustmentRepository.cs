using InvenTU.Core.Contracts.Repositories;
using InvenTU.Core.DTOs.Stock;
using InvenTU.Core.Entities;
using InvenTU.Core.Enums;
using InvenTU.Core.Exceptions;
using InvenTU.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InvenTU.Infrastructure.Repositories;

public sealed class StockAdjustmentRepository(InvenTUDbContext dbContext) : IStockAdjustmentRepository
{
    public async Task<(Guid MovementId, decimal PreviousQuantity, MovementStatus Status)> SubmitAsync(
        Guid productId,
        Guid stockLocationId,
        Guid warehouseId,
        decimal countedQuantity,
        decimal approvalThreshold,
        Guid userId,
        string? referenceNumber,
        string? notes,
        CancellationToken cancellationToken = default)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var stockItem = await dbContext.StockItems
            .Where(si => si.ProductId == productId && si.StockLocationId == stockLocationId)
            .FirstOrDefaultAsync(cancellationToken);

        var previousQuantity = stockItem?.Quantity ?? 0m;
        var delta = countedQuantity - previousQuantity;

        bool requiresApproval;
        if (countedQuantity < 0)
        {
            requiresApproval = true;
        }
        else if (previousQuantity == 0m)
        {
            requiresApproval = false;
        }
        else
        {
            requiresApproval = Math.Abs(delta) / previousQuantity > approvalThreshold;
        }

        var status = requiresApproval ? MovementStatus.PendingApproval : MovementStatus.Active;

        if (!requiresApproval)
        {
            if (stockItem is null)
            {
                stockItem = new StockItem
                {
                    Id = Guid.NewGuid(),
                    ProductId = productId,
                    StockLocationId = stockLocationId,
                    Quantity = countedQuantity,
                    QuantityReserved = 0m,
                };
                dbContext.StockItems.Add(stockItem);
            }
            else
            {
                stockItem.Quantity = countedQuantity;
            }
        }

        var movement = new StockMovement
        {
            Id = Guid.NewGuid(),
            ProductId = productId,
            SourceWarehouseId = warehouseId,
            StockLocationId = stockLocationId,
            MovementType = MovementType.Adjustment,
            Quantity = delta,
            CountedQuantity = countedQuantity,
            Status = status,
            CreatedAt = DateTime.UtcNow,
            UserId = userId,
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

        return (movement.Id, previousQuantity, status);
    }

    public Task<StockAdjustmentDto?> GetAsync(Guid movementId, CancellationToken cancellationToken = default)
        => BuildProjection(dbContext.StockMovements
            .Where(sm => sm.Id == movementId && sm.MovementType == MovementType.Adjustment))
            .FirstOrDefaultAsync(cancellationToken);

    public Task<IReadOnlyList<StockAdjustmentDto>> GetPendingAsync(CancellationToken cancellationToken = default)
        => BuildProjection(dbContext.StockMovements
            .Where(sm => sm.MovementType == MovementType.Adjustment && sm.Status == MovementStatus.PendingApproval)
            .OrderByDescending(sm => sm.CreatedAt))
            .ToListAsync(cancellationToken)
            .ContinueWith<IReadOnlyList<StockAdjustmentDto>>(t => t.Result, cancellationToken);

    public async Task ApproveAsync(Guid movementId, Guid reviewedByUserId, string? reason, CancellationToken cancellationToken = default)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var movement = await dbContext.StockMovements
            .Where(sm => sm.Id == movementId && sm.MovementType == MovementType.Adjustment)
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new StockAdjustmentNotFoundException(movementId);

        if (movement.Status != MovementStatus.PendingApproval)
        {
            throw new StockAdjustmentNotPendingException(movementId);
        }

        var countedQty = movement.CountedQuantity!.Value;

        var stockItem = await dbContext.StockItems
            .Where(si => si.ProductId == movement.ProductId && si.StockLocationId == movement.StockLocationId)
            .FirstOrDefaultAsync(cancellationToken);

        if (stockItem is null)
        {
            dbContext.StockItems.Add(new StockItem
            {
                Id = Guid.NewGuid(),
                ProductId = movement.ProductId,
                StockLocationId = movement.StockLocationId!.Value,
                Quantity = countedQty,
                QuantityReserved = 0m,
            });
        }
        else
        {
            stockItem.Quantity = countedQty;
        }

        movement.Status = MovementStatus.Approved;
        movement.ReviewedByUserId = reviewedByUserId;
        movement.ReviewedAt = DateTime.UtcNow;
        if (reason is not null)
        {
            movement.ReasonCode = reason;
        }

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new StockConflictException();
        }

        await transaction.CommitAsync(cancellationToken);
    }

    public async Task RejectAsync(Guid movementId, Guid reviewedByUserId, string? reason, CancellationToken cancellationToken = default)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var movement = await dbContext.StockMovements
            .Where(sm => sm.Id == movementId && sm.MovementType == MovementType.Adjustment)
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new StockAdjustmentNotFoundException(movementId);

        if (movement.Status != MovementStatus.PendingApproval)
        {
            throw new StockAdjustmentNotPendingException(movementId);
        }

        movement.Status = MovementStatus.Rejected;
        movement.ReviewedByUserId = reviewedByUserId;
        movement.ReviewedAt = DateTime.UtcNow;
        if (reason is not null)
        {
            movement.ReasonCode = reason;
        }

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new StockConflictException();
        }

        await transaction.CommitAsync(cancellationToken);
    }

    private static IQueryable<StockAdjustmentDto> BuildProjection(IQueryable<StockMovement> query)
        => query.Select(sm => new StockAdjustmentDto
        {
            MovementId = sm.Id,
            ProductId = sm.ProductId,
            ProductName = sm.Product.Name,
            StockLocationId = sm.StockLocationId!.Value,
            FullLocationCode = sm.StockLocation!.Warehouse.Code + "-" + sm.StockLocation.Zone
                + (sm.StockLocation.Aisle == null ? "" : "-" + sm.StockLocation.Aisle)
                + (sm.StockLocation.Shelf == null ? "" : "-" + sm.StockLocation.Shelf)
                + (sm.StockLocation.Bin == null ? "" : "-" + sm.StockLocation.Bin),
            WarehouseId = sm.SourceWarehouseId!.Value,
            WarehouseName = sm.SourceWarehouse!.Name,
            PreviousQuantity = sm.CountedQuantity!.Value - sm.Quantity,
            CountedQuantity = sm.CountedQuantity!.Value,
            Delta = sm.Quantity,
            Status = sm.Status.ToString(),
            Notes = sm.Notes,
            ReferenceNumber = sm.ReferenceNumber,
            CreatedAt = sm.CreatedAt,
            ReviewedAt = sm.ReviewedAt,
        });
}
