namespace InvenTU.Core.DTOs.Suppliers;

public sealed class UpdateSupplierRequest
{
    public string Name { get; set; } = string.Empty;
    public string? ContactEmail { get; set; }
    public string? ContactPhone { get; set; }
    public string? Address { get; set; }
    public bool IsActive { get; set; }
}
