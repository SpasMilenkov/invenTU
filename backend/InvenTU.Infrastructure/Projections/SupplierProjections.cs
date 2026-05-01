using System.Linq.Expressions;
using InvenTU.Core.DTOs.Suppliers;
using InvenTU.Core.Entities;

namespace InvenTU.Infrastructure.Projections;

internal static class SupplierProjections
{
    internal static readonly Expression<Func<Supplier, SupplierDTO>> ToDto = s => new SupplierDTO
    {
        Id = s.Id,
        Name = s.Name,
        ContactEmail =  s.ContactEmail,
        ContactPhone = s.ContactPhone,
        Address = s.Address,
    };
}
