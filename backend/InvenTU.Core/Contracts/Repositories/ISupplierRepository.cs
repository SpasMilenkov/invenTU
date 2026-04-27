using System;
using System.Collections.Generic;
using System.Text;
using InvenTU.Core.DTOs.Suppliers;
using InvenTU.Core.DTOs.Suppliers.PurchaseOrders;
using InvenTU.Core.Entities;

namespace InvenTU.Core.Contracts.Repositories;

public interface ISupplierRepository
{
    Task<IReadOnlyList<SupplierDTO>> GetSuppliersAsync(CancellationToken cancellationToken);
    Task CreateSupplierAsync(Supplier supplier, CancellationToken cancellationToken);
    Task UpdateSupplierAsync(Supplier supplier, CancellationToken cancellationToken);
    Task<Supplier?> GetSupplierForUpdateAsync(Guid id, CancellationToken cancellationToken);
    Task DeleteSupplierAsync(Supplier supplier, CancellationToken cancellationToken);
    Task CreatePurchaseOrdersAsync(PurchaseOrder purchaseOrder, CancellationToken cancellationToken);
    Task<IReadOnlyList<PurchaseOrderDTO>> GetPurchaseOrdersAsync(PurchaseOrderQueryParams purchaseOrderQueryParams, CancellationToken cancellationToken);
    Task UpdatePurchaseOrderStatusAsync(PurchaseOrder purchaseOrder, CancellationToken cancellationToken);
    Task<bool> PurchaseOrderExistsForSupplierAsync(Guid id, CancellationToken cancellationToken);
    Task<PurchaseOrder?> GetPurchaseOrderForUpdateAsync(Guid id, CancellationToken cancellationToken);
}
