using System;
using System.Collections.Generic;
using System.Text;
using InvenTU.Core.Entities;

namespace InvenTU.Core.DTOs.Suppliers.PurchaseOrders;

public sealed class CreatePurchaseOrderLineRequest
{
    public Guid PurchaseOrderId { get; set; }
    public Guid ProductId { get; set; }
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
}
