using System;
using System.Collections.Generic;
using System.Text;
using InvenTU.Core.DTOs.Suppliers;
using InvenTU.Core.DTOs.Suppliers.PurchaseOrders;

namespace InvenTU.Core.Contracts.Services;

public interface ISupplierService
{
    Task<IReadOnlyList<SupplierDTO>> GetSuppliersAsync(CancellationToken cancellationToken);
    Task<SupplierDTO> CreateSupplierAsync(CreateSupplierRequest createSupplierRequest, CancellationToken cancellationToken);
    Task<SupplierDTO> UpdateSupplierAsync(Guid id, UpdateSupplierRequest updateSupplierRequest, CancellationToken cancellationToken);
    Task DeleteSupplierAsync(Guid id, CancellationToken cancellationToken);
    Task<PurchaseOrderDTO> CreatePurchaseOrdersAsync(CreatePurchaseOrderRequest createPurchaseOrderRequest, CancellationToken cancellationToken);
    Task<IReadOnlyList<PurchaseOrderDTO>> GetPurchaseOrdersAsync(PurchaseOrderQueryParams purchaseOrderQueryParams, CancellationToken cancellationToken);
    Task UpdatePurchaseOrderStatusAsync(Guid id, CancellationToken cancellationToken);

}
