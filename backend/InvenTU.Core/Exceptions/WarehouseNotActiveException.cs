namespace InvenTU.Core.Exceptions;

public sealed class WarehouseNotActiveException(Guid warehouseId)
    : ConflictException("WAREHOUSE_NOT_ACTIVE", $"Warehouse '{warehouseId}' is not active and cannot accept new stock locations.")
{
}
