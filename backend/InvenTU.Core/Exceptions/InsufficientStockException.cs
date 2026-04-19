namespace InvenTU.Core.Exceptions;

public sealed class InsufficientStockException(decimal requested, decimal available) : AppException(422, "INSUFFICIENT_STOCK",
        $"Insufficient stock for transfer. Requested: {requested:G29}, available: {available:G29} units.")
{
}
