using System;
using System.Collections.Generic;
using System.Text;
using InvenTU.Core.DTOs.Suppliers.PurchaseOrders;
using InvenTU.Core.Entities;

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
            Status = createRequest.Status,
            OrderDate = createRequest.OrderDate,
            ExpectedDate = createRequest.ExpectedDate
        };
    }
}
