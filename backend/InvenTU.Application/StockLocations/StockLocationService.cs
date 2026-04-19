using FluentValidation;
using InvenTU.Core.Contracts.Repositories;
using InvenTU.Core.Contracts.Services;
using InvenTU.Core.DTOs.StockLocations;
using InvenTU.Core.Exceptions;
using InvenTU.Core.Extensions;
using CoreValidationException = InvenTU.Core.Exceptions.ValidationException;

namespace InvenTU.Application.StockLocations;

public sealed class StockLocationService(
    IStockLocationRepository stockLocationRepository,
    IWarehouseRepository warehouseRepository,
    IValidator<CreateStockLocationRequest> createValidator,
    IValidator<UpdateStockLocationRequest> updateValidator) : IStockLocationService
{
    public async Task<IReadOnlyList<StockLocationDto>> GetAllByWarehouseAsync(Guid warehouseId, string? zone, CancellationToken cancellationToken = default)
    {
        if (!await warehouseRepository.ExistsAsync(warehouseId, cancellationToken))
        {
            throw new WarehouseNotFoundException(warehouseId);
        }

        return await stockLocationRepository.GetAllByWarehouseAsync(warehouseId, zone, cancellationToken);
    }

    public async Task<StockLocationDto> GetByIdAsync(Guid warehouseId, Guid id, CancellationToken cancellationToken = default)
        => await stockLocationRepository.GetByIdAsync(warehouseId, id, cancellationToken)
            ?? throw new StockLocationNotFoundException(id);

    public async Task<StockLocationDto> CreateAsync(Guid warehouseId, CreateStockLocationRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var warehouse = await warehouseRepository.GetForUpdateAsync(warehouseId, cancellationToken) ?? throw new WarehouseNotFoundException(warehouseId);

        if (!warehouse.IsActive)
        {
            throw new WarehouseNotActiveException(warehouseId);
        }

        var validation = await createValidator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            var errors = validation.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
            throw new CoreValidationException(errors);
        }

        var location = request.ToEntity(warehouseId);
        await stockLocationRepository.AddAsync(location, cancellationToken);

        return await stockLocationRepository.GetByIdAsync(warehouseId, location.Id, cancellationToken) ?? throw new InvalidOperationException("Failed to retrieve the newly created stock location.");
    }

    public async Task<StockLocationDto> UpdateAsync(Guid warehouseId, Guid id, UpdateStockLocationRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var location = await stockLocationRepository.GetForUpdateAsync(warehouseId, id, cancellationToken) ?? throw new StockLocationNotFoundException(id);

        var validation = await updateValidator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            var errors = validation.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
            throw new CoreValidationException(errors);
        }

        location.ApplyUpdate(request);
        await stockLocationRepository.UpdateAsync(location, cancellationToken);

        return await stockLocationRepository.GetByIdAsync(warehouseId, id, cancellationToken) ?? throw new InvalidOperationException("Failed to retrieve the updated stock location.");
    }

    public async Task DeleteAsync(Guid warehouseId, Guid id, CancellationToken cancellationToken = default)
    {
        _ = await stockLocationRepository.GetForUpdateAsync(warehouseId, id, cancellationToken) ?? throw new StockLocationNotFoundException(id);

        var totalStock = await stockLocationRepository.GetTotalStockAsync(id, cancellationToken);
        if (totalStock > 0)
        {
            throw new StockLocationHasStockException(totalStock);
        }

        await stockLocationRepository.DeleteAsync(id, cancellationToken);
    }
}
