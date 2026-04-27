using System;
using System.Collections.Generic;
using System.Text;
using InvenTU.Core.Enums;

namespace InvenTU.Core.DTOs.Suppliers.PurchaseOrders;

public sealed class CreatePurchaseOrderRequest
{
    public Guid SupplierId { get; set; }
    public PurchaseOrderStatus Status { get; set; } = PurchaseOrderStatus.Draft;
    public DateTime OrderDate { get; set; }
    public Guid CreatedByUserId { get; set; }
    public DateTime? ExpectedDate { get; set; }
}
