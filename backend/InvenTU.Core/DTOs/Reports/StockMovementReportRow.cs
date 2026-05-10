namespace InvenTU.Core.DTOs.Reports;

/// <summary>
/// A single row in the stock movement PDF report, representing one movement event.
/// Produced by <c>IReportsRepository.GetStockMovementsForReportAsync</c> and
/// consumed directly by the QuestPDF document template.
/// </summary>
/// <param name="MovementId">Unique identifier of the movement record.</param>
/// <param name="CreatedAt">UTC timestamp when the movement was recorded.</param>
/// <param name="ReferenceNumber">
/// Optional external reference (e.g. purchase-order number, dispatch note).
/// </param>
/// <param name="ProductName">Display name of the product involved.</param>
/// <param name="SKU">Stock-keeping unit code of the product.</param>
/// <param name="MovementType">
/// The type of movement: <c>Issue</c>, <c>Receipt</c>, <c>Transfer</c>,
/// <c>Adjustment</c>, or <c>StockCount</c>.
/// </param>
/// <param name="Quantity">Quantity moved; always positive.</param>
/// <param name="SourceWarehouse">
/// Name of the source warehouse, or <c>null</c> for purely inbound movements
/// (e.g. <c>Receipt</c>).
/// </param>
/// <param name="DestinationWarehouse">
/// Name of the destination warehouse, or <c>null</c> for purely outbound
/// movements (e.g. <c>Issue</c>).
/// </param>
/// <param name="Status">Current status of the movement record.</param>
/// <param name="PerformedBy">Full name of the user who created the movement.</param>
/// <param name="Notes">Optional free-text notes attached to the movement.</param>
public sealed record StockMovementReportRow(
    Guid MovementId,
    DateTime CreatedAt,
    string? ReferenceNumber,
    string ProductName,
    string SKU,
    string MovementType,
    decimal Quantity,
    string? SourceWarehouse,
    string? DestinationWarehouse,
    string Status,
    string PerformedBy,
    string? Notes);
