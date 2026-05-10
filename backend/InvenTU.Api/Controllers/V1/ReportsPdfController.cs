using InvenTU.Core.Contracts.Services;
using InvenTU.Core.DTOs.Reports;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InvenTU.Api.Controllers.V1;

/// <summary>
/// Exposes endpoints for downloading pre-formatted PDF reports.
/// All endpoints require an authenticated user and stream the PDF directly
/// via <c>Content-Disposition: attachment</c> with a descriptive filename.
/// </summary>
[ApiController]
[Route("api/v1/reports")]
[Authorize]
public sealed class ReportsPdfController(IReportsPdfService reportsPdfService) : ControllerBase
{
    /// <summary>
    /// Generates and streams an Inventory Valuation PDF report.
    /// </summary>
    /// <remarks>
    /// The report uses FIFO costing to derive unit costs from purchase-order
    /// history, falling back to <c>Product.CostPrice</c> when no PO data
    /// exists.  The resulting PDF includes:
    /// <list type="bullet">
    ///   <item><description>Report title, generation timestamp, and page numbers.</description></item>
    ///   <item><description>Applied filter indicators (warehouse / category).</description></item>
    ///   <item><description>Per-product table ordered by SKU ascending.</description></item>
    ///   <item><description>Grand total row at the bottom of the table.</description></item>
    /// </list>
    /// </remarks>
    /// <param name="queryParams">
    /// Optional <c>warehouseId</c> and/or <c>categoryId</c> query-string
    /// filters.  When omitted the report covers all warehouses and categories.
    /// </param>
    /// <param name="cancellationToken">Token used to propagate cancellation.</param>
    /// <returns>
    /// A <c>200 OK</c> response whose body is the PDF file streamed with
    /// <c>Content-Type: application/pdf</c> and
    /// <c>Content-Disposition: attachment; filename="inventory-valuation-YYYY-MM-DD.pdf"</c>.
    /// </returns>
    [HttpGet("inventory-valuation/pdf")]
    [Produces("application/pdf")]
    public async Task<IActionResult> GetInventoryValuationPdf(
        [FromQuery] InventoryValuationQueryParams queryParams,
        CancellationToken cancellationToken)
    {
        var (bytes, fileName) = await reportsPdfService.GenerateInventoryValuationPdfAsync(
            queryParams,
            cancellationToken);

        return File(bytes, "application/pdf", fileName);
    }

    /// <summary>
    /// Generates and streams a Stock Movement PDF report.
    /// </summary>
    /// <remarks>
    /// The report covers all movements that match the supplied filters.
    /// The resulting PDF includes:
    /// <list type="bullet">
    ///   <item><description>Report title, generation timestamp, and page numbers.</description></item>
    ///   <item><description>Filter summary section showing all applied criteria.</description></item>
    ///   <item><description>
    ///     Full movement table (date, reference, product, type, quantity,
    ///     source warehouse, destination warehouse, status, performed by).
    ///   </description></item>
    ///   <item><description>
    ///     Summary counts by movement type and status, plus total units moved.
    ///   </description></item>
    /// </list>
    /// When <c>fromDate</c> is omitted the window defaults to 30 days before
    /// <c>toDate</c>.  When <c>toDate</c> is omitted it defaults to the
    /// current UTC timestamp.
    /// </remarks>
    /// <param name="queryParams">
    /// Optional date range, warehouse, movement-type, status, and product
    /// filters supplied as query-string parameters.
    /// </param>
    /// <param name="cancellationToken">Token used to propagate cancellation.</param>
    /// <returns>
    /// A <c>200 OK</c> response whose body is the PDF file streamed with
    /// <c>Content-Type: application/pdf</c> and
    /// <c>Content-Disposition: attachment; filename="stock-movement-YYYY-MM-DD.pdf"</c>.
    /// </returns>
    [HttpGet("stock-movement/pdf")]
    [Produces("application/pdf")]
    public async Task<IActionResult> GetStockMovementPdf(
        [FromQuery] StockMovementReportQueryParams queryParams,
        CancellationToken cancellationToken)
    {
        var (bytes, fileName) = await reportsPdfService.GenerateStockMovementPdfAsync(
            queryParams,
            cancellationToken);

        return File(bytes, "application/pdf", fileName);
    }
}
