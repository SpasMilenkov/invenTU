namespace InvenTU.Core.Exceptions;

public sealed class WarehouseCapacityExceededException(decimal headroom) : AppException(422, "WAREHOUSE_CAPACITY_EXCEEDED",
        $"Transfer would exceed the destination warehouse capacity. Available headroom: {headroom:G29} units.")
{
}
