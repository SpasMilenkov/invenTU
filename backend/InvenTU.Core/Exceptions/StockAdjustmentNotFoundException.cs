namespace InvenTU.Core.Exceptions;

public sealed class StockAdjustmentNotFoundException(Guid movementId)
    : NotFoundException("ADJUSTMENT_NOT_FOUND", $"Stock adjustment '{movementId}' was not found.");
