namespace InvenTU.Core.Exceptions;

public sealed class SupplierNotFoundException : NotFoundException
{
    public SupplierNotFoundException()
        : base("SUPPLIER_NOT_FOUND", "Supplier not found.")
    {
    }

    public SupplierNotFoundException(Guid id)
        : base("SUPPLIER_NOT_FOUND", $"Supplier with id '{id}' was not found.")
    {
    }
}
