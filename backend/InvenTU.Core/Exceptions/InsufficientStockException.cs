namespace InvenTU.Core.Exceptions;

public sealed class InsufficientStockException(string productName, decimal requested, decimal available) : AppException(422, "INSUFFICIENT_STOCK",
        $"Insufficient stock for '{productName}'. Requested: {requested:G29}, available: {available:G29} units.")
{
    public string ProductName { get; } = productName;
    public decimal RequestedQuantity { get; } = requested;
    public decimal AvailableQuantity { get; } = available;
}
