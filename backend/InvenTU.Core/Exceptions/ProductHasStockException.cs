namespace InvenTU.Core.Exceptions;

public sealed class ProductHasStockException : ConflictException
{
    public ProductHasStockException()
        : base("PRODUCT_HAS_STOCK", "Cannot archive a product with stock on hand. Clear all stock before archiving.")
    {
    }

    public ProductHasStockException(decimal totalStock)
        : base("PRODUCT_HAS_STOCK", $"Cannot archive a product with {totalStock} units of stock on hand. Clear all stock before archiving.")
    {
    }
}
