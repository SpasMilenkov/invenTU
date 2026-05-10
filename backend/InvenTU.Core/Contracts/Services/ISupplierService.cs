using InvenTU.Core.DTOs.Common;
using InvenTU.Core.DTOs.Suppliers;
using InvenTU.Core.DTOs.Suppliers.PurchaseOrders;

namespace InvenTU.Core.Contracts.Services;

public interface ISupplierService
{
    Task<IReadOnlyList<SupplierDTO>> GetSuppliersAsync(string? search, CancellationToken cancellationToken);
    Task<SupplierDTO> CreateSupplierAsync(CreateSupplierRequest createSupplierRequest, CancellationToken cancellationToken);
    Task<SupplierDTO> UpdateSupplierAsync(Guid id, UpdateSupplierRequest updateSupplierRequest, CancellationToken cancellationToken);
    Task DeleteSupplierAsync(Guid id, CancellationToken cancellationToken);
    Task<PurchaseOrderDTO> CreatePurchaseOrdersAsync(CreatePurchaseOrderRequest createPurchaseOrderRequest, CancellationToken cancellationToken);
    Task<PagedResult<PurchaseOrderDTO>> GetPurchaseOrdersAsync(PurchaseOrderQueryParams purchaseOrderQueryParams, CancellationToken cancellationToken);
    Task UpdatePurchaseOrderStatusAsync(Guid id, CancellationToken cancellationToken);

}
