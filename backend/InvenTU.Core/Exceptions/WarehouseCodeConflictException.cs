namespace InvenTU.Core.Exceptions;

public sealed class WarehouseCodeConflictException(string code) : ConflictException("WAREHOUSE_CODE_CONFLICT", $"A warehouse with code '{code}' already exists.")
{
}
