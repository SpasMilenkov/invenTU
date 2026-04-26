using System;
using System.Collections.Generic;
using System.Text;
using InvenTU.Core.Contracts.Repositories;
using InvenTU.Core.DTOs.Suppliers;
using InvenTU.Core.DTOs.Suppliers.PurchaseOrders;
using InvenTU.Core.Entities;

namespace InvenTU.Infrastructure.Repositories;

public sealed class SupplierRepository : ISupplierRepository
{
    public Task<PurchaseOrderDTO> CreatePurchaseOrdersAsync(PurchaseOrder purchaseOrder, CancellationToken cancellationToken) => throw new NotImplementedException();
    public Task CreateSupplierAsync(Supplier supplier, CancellationToken cancellationToken) => throw new NotImplementedException();
    public Task DeleteSupplierAsync(Guid id, CancellationToken cancellationToken) => throw new NotImplementedException();
    public Task<IReadOnlyList<PurchaseOrderDTO>> GetPurchaseOrdersAsync(PurchaseOrderQueryParams purchaseOrderQueryParams, CancellationToken cancellationToken) => throw new NotImplementedException();
    public Task<Supplier> GetSupplierForUpdateAsync(Guid id, CancellationToken cancellationToken) => throw new NotImplementedException();
    public Task<IReadOnlyList<SupplierDTO>> GetSuppliersAsync(CancellationToken cancellationToken) => throw new NotImplementedException();
    public Task UpdatePurchaseOrderStatusAsync(Guid id, CancellationToken cancellationToken) => throw new NotImplementedException();
    public Task UpdateSupplierAsync(Supplier supplier, CancellationToken cancellationToken) => throw new NotImplementedException();
}
