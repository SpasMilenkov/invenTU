using FluentValidation;
using InvenTU.Application.Auth;
using InvenTU.Core.Contracts.Repositories;
using InvenTU.Core.Contracts.Services;
using InvenTU.Core.DTOs.Stock;
using InvenTU.Core.Exceptions;
using CoreValidationException = InvenTU.Core.Exceptions.ValidationException;

namespace InvenTU.Application.Stock;

public sealed class StockAdjustmentService(
    IWarehouseRepository warehouseRepository,
    IStockLocationRepository stockLocationRepository,
    IStockAdjustmentRepository stockAdjustmentRepository,
    ICurrentUserService currentUserService,
    IValidator<AdjustStockRequest> validator) : IStockAdjustmentService
{
    private const decimal ApprovalThreshold = 0.10m;

    public async Task<StockAdjustmentDto> SubmitAsync(AdjustStockRequest request, CancellationToken cancellationToken = default)
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

        var warehouse = await warehouseRepository.GetForUpdateAsync(request.WarehouseId, cancellationToken)
            ?? throw new WarehouseNotFoundException(request.WarehouseId);

        if (!warehouse.IsActive)
            throw new WarehouseNotActiveException(warehouse.Id);

        var location = await stockLocationRepository.GetForUpdateAsync(request.WarehouseId, request.StockLocationId, cancellationToken);
        if (location is null)
        {
            throw new StockLocationInvalidException(request.StockLocationId, "does not exist or does not belong to the target warehouse");
        }

        var currentUser = await currentUserService.GetCurrentUserAsync()
            ?? throw new InvalidOperationException("Authenticated user could not be resolved.");

        var (movementId, _, _) = await stockAdjustmentRepository.SubmitAsync(
            request.ProductId,
            request.StockLocationId,
            request.WarehouseId,
            request.CountedQuantity,
            ApprovalThreshold,
            currentUser.UserId,
            request.ReferenceNumber,
            request.Notes,
            cancellationToken);

        return await stockAdjustmentRepository.GetAsync(movementId, cancellationToken)
            ?? throw new InvalidOperationException("Adjustment not found after submission.");
    }

    public Task<IReadOnlyList<StockAdjustmentDto>> GetPendingAsync(CancellationToken cancellationToken = default)
        => stockAdjustmentRepository.GetPendingAsync(cancellationToken);

    public async Task<StockAdjustmentDto> ApproveAsync(Guid movementId, ReviewAdjustmentRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var currentUser = await currentUserService.GetCurrentUserAsync()
            ?? throw new InvalidOperationException("Authenticated user could not be resolved.");

        await stockAdjustmentRepository.ApproveAsync(movementId, currentUser.UserId, request.Reason, cancellationToken);

        return await stockAdjustmentRepository.GetAsync(movementId, cancellationToken)
            ?? throw new InvalidOperationException("Adjustment not found after approval.");
    }

    public async Task<StockAdjustmentDto> RejectAsync(Guid movementId, ReviewAdjustmentRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var currentUser = await currentUserService.GetCurrentUserAsync()
            ?? throw new InvalidOperationException("Authenticated user could not be resolved.");

        await stockAdjustmentRepository.RejectAsync(movementId, currentUser.UserId, request.Reason, cancellationToken);

        return await stockAdjustmentRepository.GetAsync(movementId, cancellationToken)
            ?? throw new InvalidOperationException("Adjustment not found after rejection.");
    }
}
