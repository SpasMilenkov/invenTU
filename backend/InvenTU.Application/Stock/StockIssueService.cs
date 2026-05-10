using FluentValidation;
using InvenTU.Application.Auth;
using InvenTU.Core.Contracts.Repositories;
using InvenTU.Core.Contracts.Services;
using InvenTU.Core.DTOs.Stock;
using InvenTU.Core.Exceptions;
using CoreValidationException = InvenTU.Core.Exceptions.ValidationException;

namespace InvenTU.Application.Stock;

/// <summary>
/// Application service that orchestrates a stock issue operation:
/// validates the request, verifies warehouse and location state, resolves
/// the current user, and delegates the transactional write to
/// <see cref="IStockIssueRepository"/>.
/// </summary>
public sealed class StockIssueService(
    IWarehouseRepository warehouseRepository,
    IStockLocationRepository stockLocationRepository,
    IStockIssueRepository stockIssueRepository,
    ICurrentUserService currentUserService,
    ILiveFeedService liveFeedService,
    IValidator<IssueStockRequest> validator) : IStockIssueService
{
    /// <summary>
    /// Validates <paramref name="request"/>, confirms the target warehouse and
    /// location are active and valid, then deducts the requested quantity from
    /// available stock and writes a <c>StockMovement</c> audit record.
    /// </summary>
    /// <param name="request">The issue request submitted by the caller.</param>
    /// <param name="cancellationToken">Token used to propagate cancellation.</param>
    /// <returns>
    /// A <see cref="StockIssueDto"/> confirming the movement identifier,
    /// updated stock level, and echoed request metadata.
    /// </returns>
    /// <exception cref="ArgumentNullException">
    /// Thrown when <paramref name="request"/> is <see langword="null"/>.
    /// </exception>
    /// <exception cref="CoreValidationException">
    /// Thrown when <paramref name="request"/> fails FluentValidation rules.
    /// </exception>
    /// <exception cref="WarehouseNotFoundException">
    /// Thrown when the specified warehouse does not exist.
    /// </exception>
    /// <exception cref="WarehouseNotActiveException">
    /// Thrown when the specified warehouse is inactive.
    /// </exception>
    /// <exception cref="StockLocationInvalidException">
    /// Thrown when the stock location does not exist or does not belong to the warehouse.
    /// </exception>
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
            throw new WarehouseNotActiveException(warehouse.Id);

        var location = await stockLocationRepository.GetForUpdateAsync(request.WarehouseId, request.StockLocationId, cancellationToken);
        if (location is null)
            throw new StockLocationInvalidException(request.StockLocationId, "does not exist or does not belong to the target warehouse");

        var currentUser = await currentUserService.GetCurrentUserAsync()
            ?? throw new InvalidOperationException("Authenticated user could not be resolved.");

        var (movementId, updatedStockLevel) = await stockIssueRepository.ExecuteAsync(
            request.ProductId,
            request.StockLocationId,
            warehouse.Id,
            request.Quantity,
            currentUser.UserId,
            request.ReasonCode,
            request.ReferenceNumber,
            request.Notes,
            cancellationToken);

        await liveFeedService.BroadcastMovementAsync(new StockMovementLiveDto
        {
            MovementId = movementId,
            MovementType = "Issue",
            ProductId = request.ProductId,
            ProductName = string.Empty,
            Quantity = request.Quantity,
            DisplayQuantity = -request.Quantity,                         // -Q: stock out
            SourceWarehouseName = warehouse.Name,
            LocationCode = StockMovementLiveDto.FormatLocation(location),
            StatusOrReason = request.ReasonCode,
            Notes = request.Notes,
            OccurredAt = DateTimeOffset.UtcNow,
        }, cancellationToken);

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
            ReferenceNumber = request.ReferenceNumber,
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow,
        };
    }
}
