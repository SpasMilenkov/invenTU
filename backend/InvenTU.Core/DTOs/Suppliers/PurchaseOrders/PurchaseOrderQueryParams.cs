using System;
using System.Collections.Generic;
using System.Text;
using InvenTU.Core.Enums;

namespace InvenTU.Core.DTOs.Suppliers.PurchaseOrders;

public sealed class PurchaseOrderQueryParams
{
    public Guid? SupplierId { get; set; }
    public PurchaseOrderStatus? Status { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
}
