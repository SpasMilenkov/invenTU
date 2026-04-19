namespace InvenTU.Core.Exceptions;

public sealed class StockLocationHasStockException(decimal totalQuantity)
    : ConflictException("STOCK_LOCATION_HAS_STOCK", $"Cannot delete a stock location with {totalQuantity} units on hand.")
{
}
