using System.Text.RegularExpressions;
using InvenTU.Core.DTOs.Suppliers;
using InvenTU.Core.Entities;

namespace InvenTU.Core.Extensions;

public static class SupplierMappingExtensions
{
    public static Supplier ToEntity(this CreateSupplierRequest createRequest)
    {
        return new Supplier
        {
            Id = Guid.NewGuid(),
            Name = createRequest.Name.Trim(),
            Address = createRequest.Address?.Trim(),
            ContactEmail = createRequest.ContactEmail,
            ContactPhone = Regex.Replace(createRequest.ContactPhone ?? "", "[-.\\s]", ""),
            IsActive = createRequest.IsActive,
        };
    }

    public static void ApplyUpdate(this Supplier supplier, UpdateSupplierRequest updateRequest)
    {
        supplier.Name = updateRequest.Name.Trim();
        supplier.Address = updateRequest.Address?.Trim();
        supplier.ContactEmail = updateRequest.ContactEmail;
        supplier.ContactPhone = Regex.Replace(updateRequest.ContactPhone ?? "", "[-.\\s]", "");
        supplier.IsActive = updateRequest.IsActive;
    }
}
