namespace InvenTU.Core.Exceptions;

public sealed class StockAdjustmentNotPendingException(Guid movementId)
    : AppException(409, "ADJUSTMENT_NOT_PENDING",
        $"Stock adjustment '{movementId}' is not in PendingApproval status and cannot be reviewed.");
