using System.Linq.Expressions;
using InvenTU.Core.DTOs.Suppliers;
using InvenTU.Core.DTOs.Suppliers.PurchaseOrders;
using InvenTU.Core.Entities;

namespace InvenTU.Infrastructure.Projections;

internal static class PurchaseOrderProjections
{
    internal static readonly Expression<Func<PurchaseOrder, PurchaseOrderDTO>> ToDto = po => new PurchaseOrderDTO
    {
        Id = po.Id,
        Status = po.Status,
        SupplierId = po.SupplierId,
        SupplierName = po.Supplier.Name ?? string.Empty,
        CreatedByUserId = po.CreatedByUserId,
        CreatedByUserName = po.CreatedByUser.UserName ?? string.Empty,
        OrderDate = po.OrderDate,
        ExpectedDate = po.ExpectedDate,
    };
}
