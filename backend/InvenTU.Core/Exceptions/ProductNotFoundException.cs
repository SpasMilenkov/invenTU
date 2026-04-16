namespace InvenTU.Core.Exceptions;

public sealed class ProductNotFoundException : NotFoundException
{
    public ProductNotFoundException()
        : base("PRODUCT_NOT_FOUND", "Product not found.")
    {
    }

    public ProductNotFoundException(Guid id)
        : base("PRODUCT_NOT_FOUND", $"Product with id '{id}' was not found.")
    {
    }
}
