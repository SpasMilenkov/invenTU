using InvenTU.Core.DTOs.Suppliers.PurchaseOrders;
using InvenTU.Core.Entities;
using InvenTU.Core.Enums;

namespace InvenTU.Core.Extensions;

public static class PurchaseOrderMappingExtensions
{
    public static PurchaseOrder ToEntity(this CreatePurchaseOrderRequest createRequest)
    {
        return new PurchaseOrder
        {
            Id = Guid.NewGuid(),
            SupplierId = createRequest.SupplierId,
            CreatedByUserId = createRequest.CreatedByUserId,
            Status = PurchaseOrderStatus.Draft,
            OrderDate = createRequest.OrderDate,
            ExpectedDate = createRequest.ExpectedDate,
            PurchaseOrderLines = createRequest.PurchaseOrderLines.Select(l => l.ToEntity()).ToList(),
        };
    }
    public static PurchaseOrderLine ToEntity(this CreatePurchaseOrderLineRequest createRequest)
    {
        return new PurchaseOrderLine
        {
            Id = Guid.NewGuid(),
            PurchaseOrderId = createRequest.PurchaseOrderId,
            ProductId = createRequest.ProductId,
            Quantity = createRequest.Quantity,
            UnitPrice = createRequest.UnitPrice,
        };
    }
}
