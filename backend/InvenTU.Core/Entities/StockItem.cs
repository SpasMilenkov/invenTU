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

    public void Deduct(decimal quantity, string productName)
    {
        if (Quantity - quantity < 0)
        {
            throw new InsufficientStockException(productName, quantity, Quantity);
        }

        Quantity -= quantity;
    }
}
