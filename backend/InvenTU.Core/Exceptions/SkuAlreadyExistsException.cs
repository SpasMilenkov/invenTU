namespace InvenTU.Core.Exceptions;

public sealed class SkuAlreadyExistsException : ConflictException
{
    public SkuAlreadyExistsException(string sku)
        : base("SKU_CONFLICT", $"A product with SKU '{sku}' already exists.")
    {
    }
}
