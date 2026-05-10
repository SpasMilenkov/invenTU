using System;
using System.Collections.Generic;
using System.Text;
using InvenTU.Core.Enums;

namespace InvenTU.Core.DTOs.Suppliers.PurchaseOrders;

public sealed class CreatePurchaseOrderRequest
{
    public Guid SupplierId { get; set; }
    public DateTime OrderDate { get; set; }
    public Guid CreatedByUserId { get; set; }
    public DateTime? ExpectedDate { get; set; }
    public IReadOnlyList<CreatePurchaseOrderLineRequest> PurchaseOrderLines { get; set; } = [];
}
