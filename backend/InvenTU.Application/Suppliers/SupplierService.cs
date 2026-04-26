using System;
using System.Collections.Generic;
using System.Text;
using InvenTU.Core.Contracts.Services;
using InvenTU.Core.DTOs.Suppliers;
using InvenTU.Core.DTOs.Suppliers.PurchaseOrders;

namespace InvenTU.Application.Suppliers;

public sealed class SupplierService : ISupplierService
{
    public Task<PurchaseOrderDTO> CreatePurchaseOrdersAsync(CreatePurchaseOrderRequest createPurchaseOrderRequest, CancellationToken cancellationToken) => throw new NotImplementedException();
    public Task<SupplierDTO> CreateSupplierAsync(CreateSupplierRequest createSupplierRequest, CancellationToken cancellationToken) => throw new NotImplementedException();
    public Task DeleteSupplierAsync(Guid id, CancellationToken cancellationToken) => throw new NotImplementedException();
    public Task<IReadOnlyList<PurchaseOrderDTO>> GetPurchaseOrdersAsync(PurchaseOrderQueryParams purchaseOrderQueryParams, CancellationToken cancellationToken) => throw new NotImplementedException();
    public Task<IReadOnlyList<SupplierDTO>> GetSuppliersAsync(CancellationToken cancellationToken) => throw new NotImplementedException();
    public Task UpdatePurchaseOrderStatusAsync(Guid id, CancellationToken cancellationToken) => throw new NotImplementedException();
    public Task<SupplierDTO> UpdateSupplierAsync(Guid id, UpdateSupplierRequest updateSupplierRequest, CancellationToken cancellationToken) => throw new NotImplementedException();
}
