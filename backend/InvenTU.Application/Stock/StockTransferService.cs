using FluentValidation;
using InvenTU.Application.Auth;
using InvenTU.Core.Contracts.Repositories;
using InvenTU.Core.Contracts.Services;
using InvenTU.Core.DTOs.Stock;
using InvenTU.Core.Enums;
using InvenTU.Core.Exceptions;
using CoreValidationException = InvenTU.Core.Exceptions.ValidationException;

namespace InvenTU.Application.Stock;

/// <summary>
/// Application service that orchestrates a stock transfer operation between
/// two warehouse locations: validates the request, verifies both warehouses
/// and their locations are active and valid, enforces destination capacity
/// limits, resolves the current user, and delegates the transactional write
/// to <see cref="IStockTransferRepository"/>.
/// </summary>
public sealed class StockTransferService(
    IWarehouseRepository warehouseRepository,
    IStockLocationRepository stockLocationRepository,
    IStockTransferRepository stockTransferRepository,
    ICurrentUserService currentUserService,
    IAlertService alertService,
    IValidator<TransferStockRequest> validator) : IStockTransferService
{
    /// <summary>
    /// Validates <paramref name="request"/>, enforces warehouse and location
    /// business rules (active state, capacity), then moves stock from the
    /// source to the destination location and writes a <c>StockMovement</c>
    /// audit record.
    /// </summary>
    /// <param name="request">The transfer request submitted by the caller.</param>
    /// <param name="cancellationToken">Token used to propagate cancellation.</param>
    /// <returns>
    /// A <see cref="StockTransferDto"/> confirming the movement identifier
    /// and echoing warehouse names and quantity.
    /// </returns>
    /// <exception cref="ArgumentNullException">
    /// Thrown when <paramref name="request"/> is <see langword="null"/>.
    /// </exception>
    /// <exception cref="CoreValidationException">
    /// Thrown when <paramref name="request"/> fails FluentValidation rules.
    /// </exception>
    /// <exception cref="WarehouseNotFoundException">
    /// Thrown when either the source or destination warehouse does not exist.
    /// </exception>
    /// <exception cref="WarehouseNotActiveException">
    /// Thrown when either warehouse is inactive. A system alert is also raised
    /// for the Admin role before the exception propagates.
    /// </exception>
    /// <exception cref="WarehouseCapacityExceededException">
    /// Thrown when transferring the requested quantity would exceed the
    /// destination warehouse's <c>MaxStockLevel</c>.
    /// </exception>
    /// <exception cref="StockLocationNotFoundException">
    /// Thrown when either stock location does not exist or does not belong
    /// to its expected warehouse.
    /// </exception>
    public async Task<StockTransferDto> TransferAsync(
        TransferStockRequest request,
        CancellationToken cancellationToken = default)
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
            await alertService.CreateSystemAlertForRoleAsync(
                AlertType.InactiveWarehouseTransferAttempt,
                $"Consider activating warehouse '{sourceWarehouse.Name}' or choose an alternative.",
                sourceWarehouse.Id,
                "Admin",
                cancellationToken);

            throw new WarehouseNotActiveException(sourceWarehouse.Id);
        }

        var destWarehouse = await warehouseRepository.GetForUpdateAsync(request.DestinationWarehouseId, cancellationToken)
            ?? throw new WarehouseNotFoundException(request.DestinationWarehouseId);

        if (!destWarehouse.IsActive)
        {
            await alertService.CreateSystemAlertForRoleAsync(
                AlertType.InactiveWarehouseTransferAttempt,
                $"Consider activating warehouse '{destWarehouse.Name}' or choose an alternative.",
                destWarehouse.Id,
                "Admin",
                cancellationToken);

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

        var currentUser = await currentUserService.GetCurrentUserAsync()
            ?? throw new InvalidOperationException("Authenticated user could not be resolved.");

        var movementId = await stockTransferRepository.ExecuteAsync(
            request.ProductId,
            request.SourceStockLocationId,
            sourceWarehouse.Id,
            request.DestinationStockLocationId,
            destWarehouse.Id,
            request.Quantity,
            currentUser.UserId,
            request.ReasonCode,
            request.ReferenceNumber,
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
