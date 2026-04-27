using InvenTU.Core.Contracts.Repositories;
using InvenTU.Core.Contracts.Services;
using InvenTU.Core.DTOs.Suppliers;
using InvenTU.Core.DTOs.Suppliers.PurchaseOrders;
using InvenTU.Core.Entities;

namespace InvenTU.Application.Suppliers;

public sealed class SupplierService (ISupplierRepository supplierRepository) : ISupplierService
{
    public async Task<PurchaseOrderDTO> CreatePurchaseOrdersAsync(CreatePurchaseOrderRequest createPurchaseOrderRequest, CancellationToken cancellationToken)
    {
        var newPurchaseOrder = new PurchaseOrder
        {
            Id = Guid.NewGuid(),
            SupplierId = createPurchaseOrderRequest.SupplierId,
            CreatedByUserId = createPurchaseOrderRequest.CreatedByUserId,
            Status = createPurchaseOrderRequest.Status,
            OrderDate = createPurchaseOrderRequest.OrderDate,
            ExpectedDate = createPurchaseOrderRequest.ExpectedDate
        };

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
        var newSupplier = new Supplier
        {
            Id = Guid.NewGuid(),
            Name = createSupplierRequest.Name,
            ContactEmail = createSupplierRequest.ContactEmail,
            ContactPhone = createSupplierRequest.ContactPhone,
            Address = createSupplierRequest.Address
        };

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
        if (!await supplierRepository.PurchaseOrderExistsForSupplierAsync(id, cancellationToken))
        {
            var supplierToDeactivate = await supplierRepository.GetSupplierForUpdateAsync(id, cancellationToken) ?? throw new InvalidOperationException("Can't find supplier for update");
            await supplierRepository.DeleteSupplierAsync(supplierToDeactivate, cancellationToken);
        }
    }
    public async Task<IReadOnlyList<PurchaseOrderDTO>> GetPurchaseOrdersAsync(PurchaseOrderQueryParams purchaseOrderQueryParams, CancellationToken cancellationToken)
    {
        return await supplierRepository.GetPurchaseOrdersAsync(purchaseOrderQueryParams, cancellationToken);
    }
    public async Task<IReadOnlyList<SupplierDTO>> GetSuppliersAsync(CancellationToken cancellationToken)
    {
        return await supplierRepository.GetSuppliersAsync(cancellationToken);
    }
    public async Task UpdatePurchaseOrderStatusAsync(Guid id, CancellationToken cancellationToken)
    {
        var purchaseOrderForUpdate = await supplierRepository.GetPurchaseOrderForUpdateAsync(id, cancellationToken) ?? throw new InvalidOperationException("Can't find purchase order for status update");

        await supplierRepository.UpdatePurchaseOrderStatusAsync(purchaseOrderForUpdate, cancellationToken);
    }
    public async Task<SupplierDTO> UpdateSupplierAsync(Guid id, UpdateSupplierRequest updateSupplierRequest, CancellationToken cancellationToken)
    {
        var supplierForUpdate = await supplierRepository.GetSupplierForUpdateAsync(id, cancellationToken) ?? throw new InvalidOperationException("Can't find supplier for update");

        supplierForUpdate.Name = updateSupplierRequest.Name;
        supplierForUpdate.Address = updateSupplierRequest.Address;
        supplierForUpdate.ContactEmail = updateSupplierRequest.ContactEmail;
        supplierForUpdate.ContactPhone = updateSupplierRequest.ContactPhone;

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
