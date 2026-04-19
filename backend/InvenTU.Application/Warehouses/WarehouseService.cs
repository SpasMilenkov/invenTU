using FluentValidation;
using InvenTU.Core.Contracts.Repositories;
using InvenTU.Core.Contracts.Services;
using InvenTU.Core.DTOs.Warehouses;
using InvenTU.Core.Exceptions;
using InvenTU.Core.Extensions;
using CoreValidationException = InvenTU.Core.Exceptions.ValidationException;

namespace InvenTU.Application.Warehouses;

public sealed class WarehouseService(
    IWarehouseRepository warehouseRepository,
    IValidator<CreateWarehouseRequest> createValidator,
    IValidator<UpdateWarehouseRequest> updateValidator) : IWarehouseService
{
    public async Task<IReadOnlyList<WarehouseDto>> GetAllAsync(CancellationToken cancellationToken = default)
        => await warehouseRepository.GetAllAsync(cancellationToken);

    public async Task<WarehouseDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => await warehouseRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new WarehouseNotFoundException(id);

    public async Task<WarehouseDto> CreateAsync(CreateWarehouseRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var validation = await createValidator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            var errors = validation.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(e => e.ErrorMessage).ToArray());
            throw new CoreValidationException(errors);
        }

        var normalizedCode = request.Code.Trim().ToUpperInvariant();
        if (await warehouseRepository.CodeExistsAsync(normalizedCode, cancellationToken))
        {
            throw new WarehouseCodeConflictException(request.Code);
        }

        var warehouse = request.ToEntity();
        await warehouseRepository.AddAsync(warehouse, cancellationToken);

        return await warehouseRepository.GetByIdAsync(warehouse.Id, cancellationToken) ?? throw new InvalidOperationException("Failed to retrieve the newly created warehouse.");
    }

    public async Task<WarehouseDto> UpdateAsync(
        Guid id,
        UpdateWarehouseRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var warehouse = await warehouseRepository.GetForUpdateAsync(id, cancellationToken) ?? throw new WarehouseNotFoundException(id);

        var validation = await updateValidator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            var errors = validation.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(e => e.ErrorMessage).ToArray());
            throw new CoreValidationException(errors);
        }

        warehouse.ApplyUpdate(request);
        await warehouseRepository.UpdateAsync(warehouse, cancellationToken);

        return await warehouseRepository.GetByIdAsync(id, cancellationToken) ?? throw new InvalidOperationException("Failed to retrieve the updated warehouse.");
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        if (!await warehouseRepository.ExistsAsync(id, cancellationToken))
        {
            throw new WarehouseNotFoundException(id);
        }

        var totalStock = await warehouseRepository.GetTotalStockAsync(id, cancellationToken);
        if (totalStock > 0)
        {
            throw new WarehouseHasStockException(totalStock);
        }

        await warehouseRepository.DeleteAsync(id, cancellationToken);
    }

    public async Task DeactivateAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var warehouse = await warehouseRepository.GetForUpdateAsync(id, cancellationToken) ?? throw new WarehouseNotFoundException(id);

        warehouse.IsActive = false;
        await warehouseRepository.UpdateAsync(warehouse, cancellationToken);
    }
}
