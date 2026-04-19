namespace InvenTU.Core.Entities;

public sealed class ProductSupplier
{
    public Guid ProductId { get; set; }
    public Guid SupplierId { get; set; }
    public bool IsPrimary { get; set; }
    public string? SupplierSKU { get; set; }
    public decimal? UnitCost { get; set; }
    public int? LeadTimeDays { get; set; }

    public Product Product { get; set; } = null!;
    public Supplier Supplier { get; set; } = null!;
}
