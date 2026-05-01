using System;
using System.Collections.Generic;
using System.Text;
using InvenTU.Core.Entities;
using InvenTU.Core.Enums;

namespace InvenTU.Core.DTOs.Suppliers.PurchaseOrders;

public sealed class PurchaseOrderDTO
{
    public Guid Id { get; set; }
    public Guid SupplierId { get; set; }
    public string SupplierName { get; set; } = string.Empty;
    public PurchaseOrderStatus Status { get; set; }
    public DateTime OrderDate { get; set; }
    public Guid CreatedByUserId { get; set; }
    public string CreatedByUserName { get; set; } = string.Empty;
    public DateTime? ExpectedDate { get; set; }
    
    
}
