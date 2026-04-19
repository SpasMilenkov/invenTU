namespace InvenTU.Core.Exceptions;

public sealed class WarehouseHasStockException(decimal totalQuantity) : ConflictException("WAREHOUSE_HAS_STOCK", $"Cannot delete an active warehouse with {totalQuantity} units of stock on hand. Deactivate the warehouse and clear all stock first.")
{
}
