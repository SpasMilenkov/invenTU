using FluentValidation;
using InvenTU.Application.Auth;
using InvenTU.Core.Contracts.Repositories;
using InvenTU.Core.Contracts.Services;
using InvenTU.Core.DTOs.Stock;
using InvenTU.Core.Exceptions;
using CoreValidationException = InvenTU.Core.Exceptions.ValidationException;

namespace InvenTU.Application.Stock;

public sealed class StockIssueService(
    IWarehouseRepository warehouseRepository,
    IStockLocationRepository stockLocationRepository,
    IStockIssueRepository stockIssueRepository,
    ICurrentUserService currentUserService,
    IValidator<IssueStockRequest> validator) : IStockIssueService
{
    public async Task<StockIssueDto> IssueAsync(IssueStockRequest request, CancellationToken cancellationToken = default)
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
        {
            throw new WarehouseNotActiveException(warehouse.Id);
        }

        var location = await stockLocationRepository.GetForUpdateAsync(request.WarehouseId, request.StockLocationId, cancellationToken);
        if (location is null)
        {
            throw new StockLocationInvalidException(request.StockLocationId, "does not exist or does not belong to the target warehouse");
        }

        var currentUser = await currentUserService.GetCurrentUserAsync()
            ?? throw new InvalidOperationException("Authenticated user could not be resolved.");

        var (movementId, updatedStockLevel) = await stockIssueRepository.ExecuteAsync(
            request.ProductId,
            request.StockLocationId,
            warehouse.Id,
            request.Quantity,
            currentUser.UserId,
            request.ReasonCode,
            request.Notes,
            cancellationToken);

        return new StockIssueDto
        {
            MovementId = movementId,
            ProductId = request.ProductId,
            ProductName = string.Empty,
            WarehouseId = warehouse.Id,
            WarehouseName = warehouse.Name,
            StockLocationId = request.StockLocationId,
            Quantity = request.Quantity,
            UpdatedStockLevel = updatedStockLevel,
            ReasonCode = request.ReasonCode,
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow,
        };
    }
}
