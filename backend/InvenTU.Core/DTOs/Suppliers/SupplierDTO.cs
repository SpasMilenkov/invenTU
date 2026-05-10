using System;
using System.Collections.Generic;
using System.Text;

namespace InvenTU.Core.DTOs.Suppliers;

public sealed class SupplierDTO
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ContactEmail { get; set; }
    public string? ContactPhone { get; set; }
    public string? Address { get; set; }
}
