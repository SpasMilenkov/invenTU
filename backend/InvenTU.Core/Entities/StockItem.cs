using InvenTU.Core.Exceptions;

namespace InvenTU.Core.Entities;

public sealed class StockItem
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public Guid StockLocationId { get; set; }
    public decimal Quantity { get; set; }
    public decimal QuantityReserved { get; set; }
    public byte[] RowVersion { get; set; } = null!;

    public Product Product { get; set; } = null!;
    public StockLocation StockLocation { get; set; } = null!;

    /// <summary>
    /// Deducts <paramref name="quantity"/> from total stock (Quantity).
    /// Throws <see cref="InsufficientStockException"/> if total stock is insufficient.
    /// QuantityReserved is not modified.
    /// </summary>
    public void Deduct(decimal quantity, string productName)
    {
        if (Quantity - quantity < 0)
        {
            throw new InsufficientStockException(productName, quantity, Quantity);
        }

        Quantity -= quantity;
    }

    /// <summary>
    /// Deducts <paramref name="quantity"/> from available stock (Quantity − QuantityReserved).
    /// Throws <see cref="InsufficientStockException"/> if available stock is insufficient.
    /// QuantityReserved is not modified.
    /// </summary>
    public void Issue(decimal quantity, string productName)
    {
        var available = Quantity - QuantityReserved;
        if (available < quantity)
        {
            throw new InsufficientStockException(productName, quantity, available);
        }

        Quantity -= quantity;
    }
}
