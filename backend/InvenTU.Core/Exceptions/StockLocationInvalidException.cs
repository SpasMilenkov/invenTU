namespace InvenTU.Core.Exceptions;

public sealed class StockLocationInvalidException(Guid id, string reason)
    : BadRequestException("STOCK_LOCATION_INVALID", $"Stock location '{id}' {reason}.")
{
}
