using InvenTU.Core.DTOs.Common;
using InvenTU.Core.DTOs.Suppliers;
using InvenTU.Core.DTOs.Suppliers.PurchaseOrders;
using InvenTU.Core.Entities;

namespace InvenTU.Core.Contracts.Repositories;

public interface ISupplierRepository
{
    Task<IReadOnlyList<SupplierDTO>> GetSuppliersAsync(string? search, CancellationToken cancellationToken);
    Task CreateSupplierAsync(Supplier supplier, CancellationToken cancellationToken);
    Task UpdateSupplierAsync(Supplier supplier, CancellationToken cancellationToken);
    Task<Supplier?> GetSupplierForUpdateAsync(Guid id, CancellationToken cancellationToken);
    Task DeleteSupplierAsync(Guid id, CancellationToken cancellationToken);
    Task CreatePurchaseOrdersAsync(PurchaseOrder purchaseOrder, CancellationToken cancellationToken);
    Task<PagedResult<PurchaseOrderDTO>> GetPurchaseOrdersAsync(PurchaseOrderQueryParams purchaseOrderQueryParams, CancellationToken cancellationToken);
    Task UpdatePurchaseOrderStatusAsync(PurchaseOrder purchaseOrder, CancellationToken cancellationToken);
    Task<bool> PurchaseOrderExistsForSupplierAsync(Guid id, CancellationToken cancellationToken);
    Task<bool> ProductsExistsForSupplierAsync(Guid id, CancellationToken cancellationToken);
    Task<PurchaseOrder?> GetPurchaseOrderForUpdateAsync(Guid id, CancellationToken cancellationToken);
}
