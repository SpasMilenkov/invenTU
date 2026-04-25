namespace InvenTU.Core.Exceptions;

public sealed class StockConflictException : ConflictException
{
    public StockConflictException()
        : base("STOCK_CONFLICT", "The stock record was modified by another operation. Please retry.")
    {
    }
}
