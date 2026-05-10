using FluentValidation;
using InvenTU.Core.Contracts.Repositories;
using InvenTU.Core.Contracts.Services;
using InvenTU.Core.DTOs.Common;
using InvenTU.Core.DTOs.Suppliers;
using InvenTU.Core.DTOs.Suppliers.PurchaseOrders;
using InvenTU.Core.Exceptions;
using InvenTU.Core.Extensions;
using ValidationException = InvenTU.Core.Exceptions.ValidationException;

namespace InvenTU.Application.Suppliers;

public sealed class SupplierService (
    ISupplierRepository supplierRepository,
    IValidator<CreateSupplierRequest> createSupplierRequestValidator,
    IValidator<UpdateSupplierRequest> updateSupplierRequestValidator) : ISupplierService
{
    public async Task<PurchaseOrderDTO> CreatePurchaseOrdersAsync(CreatePurchaseOrderRequest createPurchaseOrderRequest, CancellationToken cancellationToken)
    {
        var newPurchaseOrder = createPurchaseOrderRequest.ToEntity();

        await supplierRepository.CreatePurchaseOrdersAsync(newPurchaseOrder, cancellationToken);

        return new PurchaseOrderDTO
        {
            Id = newPurchaseOrder.Id,
            SupplierId = newPurchaseOrder.SupplierId,
            CreatedByUserId = newPurchaseOrder.CreatedByUserId,
            Status = newPurchaseOrder.Status,
            OrderDate = newPurchaseOrder.OrderDate,
            ExpectedDate = newPurchaseOrder.ExpectedDate
        };
    }
    public async Task<SupplierDTO> CreateSupplierAsync(CreateSupplierRequest createSupplierRequest, CancellationToken cancellationToken)
    {
        var validationResult = await createSupplierRequestValidator.ValidateAsync(createSupplierRequest, cancellationToken);

        if (!validationResult.IsValid)
        {
            // Reformats the validation error into more descriptive custom exception 
            var errorDictionary = validationResult.Errors.GroupBy(e => e.PropertyName)
                                    .ToDictionary(p => p.Key,
                                        p => p.Select(p => p.ErrorMessage).ToArray()
                                    );

            throw new ValidationException(errorDictionary);
        }

        var newSupplier = createSupplierRequest.ToEntity();

        await supplierRepository.CreateSupplierAsync(newSupplier, cancellationToken);

        return new SupplierDTO
        {
            Id = newSupplier.Id,
            Name = newSupplier.Name,
            ContactEmail = newSupplier.ContactEmail,
            ContactPhone = newSupplier.ContactPhone,
            Address = newSupplier.Address
        };
    }
    public async Task DeleteSupplierAsync(Guid id, CancellationToken cancellationToken)
    {
        if (await supplierRepository.PurchaseOrderExistsForSupplierAsync(id, cancellationToken))
            throw new SupplierHasPurchaseOrdersException();

        await supplierRepository.DeleteSupplierAsync(id, cancellationToken);
    }

    public async Task ArchiveAsync(Guid id, CancellationToken cancellationToken)
    {
        var archived = await supplierRepository.ArchiveAsync(id, cancellationToken);
        if (!archived)
            throw new SupplierNotFoundException(id);
    }

    public async Task RestoreAsync(Guid id, CancellationToken cancellationToken)
    {
        var restored = await supplierRepository.RestoreAsync(id, cancellationToken);
        if (!restored)
            throw new SupplierNotFoundException(id);
    }
    public async Task<PagedResult<PurchaseOrderDTO>> GetPurchaseOrdersAsync(PurchaseOrderQueryParams purchaseOrderQueryParams, CancellationToken cancellationToken)
    {
        return await supplierRepository.GetPurchaseOrdersAsync(purchaseOrderQueryParams, cancellationToken);
    }
    public async Task<IReadOnlyList<SupplierDTO>> GetSuppliersAsync(SupplierQueryParams queryParams, CancellationToken cancellationToken)
    {
        var normalised = new SupplierQueryParams
        {
            Search = queryParams.Search?.Trim().ToUpperInvariant(),
            Archive = queryParams.Archive,
        };
        return await supplierRepository.GetSuppliersAsync(normalised, cancellationToken);
    }
    public async Task UpdatePurchaseOrderStatusAsync(Guid id, CancellationToken cancellationToken)
    {
        var purchaseOrderForUpdate = await supplierRepository.GetPurchaseOrderForUpdateAsync(id, cancellationToken) ?? throw new InvalidOperationException("Can't find purchase order for status update");

        await supplierRepository.UpdatePurchaseOrderStatusAsync(purchaseOrderForUpdate, cancellationToken);
    }
    public async Task<SupplierDTO> UpdateSupplierAsync(Guid id, UpdateSupplierRequest updateSupplierRequest, CancellationToken cancellationToken)
    {
        var validationResult = await updateSupplierRequestValidator.ValidateAsync(updateSupplierRequest, cancellationToken);

        if (!validationResult.IsValid)
        {
            // Reformats the validation error into more descriptive custom exception 
            var errorDictionary = validationResult.Errors.GroupBy(e => e.PropertyName)
                                    .ToDictionary(p => p.Key,
                                        p => p.Select(p => p.ErrorMessage).ToArray()
                                    );

            throw new ValidationException(errorDictionary);
        }

        var supplierForUpdate = await supplierRepository.GetSupplierForUpdateAsync(id, cancellationToken) ?? throw new InvalidOperationException("Can't find supplier for update");

        supplierForUpdate.ApplyUpdate(updateSupplierRequest);

        await supplierRepository.UpdateSupplierAsync(supplierForUpdate, cancellationToken);

        return new SupplierDTO
        {
            Id = id,
            Name = supplierForUpdate.Name,
            Address = supplierForUpdate.Address,
            ContactPhone = supplierForUpdate.ContactPhone,
            ContactEmail = supplierForUpdate.ContactEmail
        };
    }
}
