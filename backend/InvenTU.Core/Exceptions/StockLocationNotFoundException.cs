namespace InvenTU.Core.Exceptions;

public sealed class StockLocationNotFoundException(Guid id)
    : NotFoundException("STOCK_LOCATION_NOT_FOUND", $"Stock location '{id}' was not found.")
{
}
