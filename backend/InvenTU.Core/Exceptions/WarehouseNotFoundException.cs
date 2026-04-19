namespace InvenTU.Core.Exceptions;

public sealed class WarehouseNotFoundException(Guid id) : NotFoundException("WAREHOUSE_NOT_FOUND", $"Warehouse '{id}' was not found.")
{
}
