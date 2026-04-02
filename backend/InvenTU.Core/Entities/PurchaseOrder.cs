using InvenTU.Core.Enums;

namespace InvenTU.Core.Entities;

public sealed class PurchaseOrder
{
    public Guid Id { get; set; }
    public Guid SupplierId { get; set; }
    public PurchaseOrderStatus Status { get; set; }
    public DateTime OrderDate { get; set; }
    public Guid CreatedByUserId { get; set; }
    public DateTime? ExpectedDate { get; set; }

    public Supplier Supplier { get; set; } = null!;
    public User CreatedByUser { get; set; } = null!;
    public ICollection<PurchaseOrderLine> PurchaseOrderLines { get; set; } = [];
}
