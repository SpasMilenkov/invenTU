using FluentValidation;
using InvenTU.Application.Auth;
using InvenTU.Core.Contracts.Repositories;
using InvenTU.Core.Contracts.Services;
using InvenTU.Core.DTOs.Stock;
using InvenTU.Core.Exceptions;
using CoreValidationException = InvenTU.Core.Exceptions.ValidationException;

namespace InvenTU.Application.Stock;

public sealed class StockTransferService(
    IWarehouseRepository warehouseRepository,
    IStockLocationRepository stockLocationRepository,
    IStockTransferRepository stockTransferRepository,
    ICurrentUserService currentUserService,
    IValidator<TransferStockRequest> validator) : IStockTransferService
{
    public async Task<StockTransferDto> TransferAsync(TransferStockRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
            throw new CoreValidationException(errors);
        }

        var sourceWarehouse = await warehouseRepository.GetForUpdateAsync(request.SourceWarehouseId, cancellationToken)
            ?? throw new WarehouseNotFoundException(request.SourceWarehouseId);

        if (!sourceWarehouse.IsActive)
        {
            throw new WarehouseNotActiveException(sourceWarehouse.Id);
        }

        var destWarehouse = await warehouseRepository.GetForUpdateAsync(request.DestinationWarehouseId, cancellationToken)
            ?? throw new WarehouseNotFoundException(request.DestinationWarehouseId);

        if (!destWarehouse.IsActive)
        {
            throw new WarehouseNotActiveException(destWarehouse.Id);
        }

        if (destWarehouse.MaxStockLevel.HasValue)
        {
            var currentTotal = await warehouseRepository.GetTotalStockAsync(request.DestinationWarehouseId, cancellationToken);
            var headroom = (decimal)destWarehouse.MaxStockLevel.Value - currentTotal;
            if (request.Quantity > headroom)
            {
                throw new WarehouseCapacityExceededException(Math.Max(0m, headroom));
            }
        }

        _ = await stockLocationRepository.GetForUpdateAsync(request.SourceWarehouseId, request.SourceStockLocationId, cancellationToken)
            ?? throw new StockLocationNotFoundException(request.SourceStockLocationId);

        _ = await stockLocationRepository.GetForUpdateAsync(request.DestinationWarehouseId, request.DestinationStockLocationId, cancellationToken)
            ?? throw new StockLocationNotFoundException(request.DestinationStockLocationId);

        var currentUser = await currentUserService.GetCurrentUserAsync() ?? throw new InvalidOperationException("Authenticated user could not be resolved.");

        var movementId = await stockTransferRepository.ExecuteAsync(
            request.ProductId,
            request.SourceStockLocationId,
            sourceWarehouse.Id,
            request.DestinationStockLocationId,
            destWarehouse.Id,
            request.Quantity,
            currentUser.UserId,
            request.Notes,
            cancellationToken);

        return new StockTransferDto
        {
            MovementId = movementId,
            ProductId = request.ProductId,
            ProductName = string.Empty,
            SourceWarehouseId = sourceWarehouse.Id,
            SourceWarehouseName = sourceWarehouse.Name,
            DestinationWarehouseId = destWarehouse.Id,
            DestinationWarehouseName = destWarehouse.Name,
            Quantity = request.Quantity,
            CreatedAt = DateTime.UtcNow,
        };
    }
}
