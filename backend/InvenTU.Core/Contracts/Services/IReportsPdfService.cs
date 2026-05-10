using InvenTU.Core.DTOs.Reports;

namespace InvenTU.Core.Contracts.Services;

/// <summary>
/// Generates formatted, ready-to-download PDF reports for inventory and
/// stock movement data.
/// </summary>
/// <remarks>
/// Implementations are expected to orchestrate data retrieval from
/// <see cref="IReportsService"/> and repository layer, then delegate
/// PDF rendering to the QuestPDF document templates.
/// </remarks>
public interface IReportsPdfService
{
    /// <summary>
    /// Generates a FIFO-based inventory valuation PDF report and returns the
    /// raw bytes together with a descriptive filename.
    /// </summary>
    /// <param name="queryParams">
    /// Optional warehouse and/or category filters.  When both are omitted the
    /// report covers every active product across all warehouses.
    /// </param>
    /// <param name="cancellationToken">Token used to propagate cancellation.</param>
    /// <returns>
    /// A tuple of:
    /// <list type="bullet">
    ///   <item><description>
    ///     <c>Bytes</c> — the complete PDF file as a byte array.
    ///   </description></item>
    ///   <item><description>
    ///     <c>FileName</c> — a descriptive filename for the
    ///     <c>Content-Disposition</c> header,
    ///     e.g. <c>inventory-valuation-2026-03-15.pdf</c>.
    ///   </description></item>
    /// </list>
    /// </returns>
    Task<(byte[] Bytes, string FileName)> GenerateInventoryValuationPdfAsync(
        InventoryValuationQueryParams queryParams,
        CancellationToken cancellationToken);

    /// <summary>
    /// Generates a stock movement PDF report for the specified filters and
    /// returns the raw bytes together with a descriptive filename.
    /// </summary>
    /// <param name="queryParams">
    /// Date range, warehouse, movement-type, status, and product filters.
    /// All fields are optional; omitted date values are resolved to sensible
    /// defaults (last 30 days) before the query is executed.
    /// </param>
    /// <param name="cancellationToken">Token used to propagate cancellation.</param>
    /// <returns>
    /// A tuple of:
    /// <list type="bullet">
    ///   <item><description>
    ///     <c>Bytes</c> — the complete PDF file as a byte array.
    ///   </description></item>
    ///   <item><description>
    ///     <c>FileName</c> — a descriptive filename for the
    ///     <c>Content-Disposition</c> header,
    ///     e.g. <c>stock-movement-2026-03-15.pdf</c>.
    ///   </description></item>
    /// </list>
    /// </returns>
    Task<(byte[] Bytes, string FileName)> GenerateStockMovementPdfAsync(
        StockMovementReportQueryParams queryParams,
        CancellationToken cancellationToken);
}
