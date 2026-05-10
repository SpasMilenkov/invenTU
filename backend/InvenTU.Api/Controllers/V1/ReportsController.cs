using InvenTU.Core.Contracts.Services;
using InvenTU.Core.DTOs.Reports;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Globalization;
using System.Text;

namespace InvenTU.Api.Controllers.V1;

/// <summary>
/// Controller for generating inventory reports.
/// All endpoints require authentication.
/// </summary>
[ApiController]
[Route("api/v1/reports")]
[Authorize]
public sealed class ReportsController(IReportsService reportsService) : ControllerBase
{
    /// <summary>
    /// Calculates the annualised inventory turnover ratio per product for the specified date range.
    /// </summary>
    /// <remarks>
    /// The turnover ratio is computed as:
    /// <code>(total units issued ÷ average stock level) × (365 ÷ days in period)</code>
    ///
    /// <b>Average stock level</b> is the current on-hand quantity across all stock locations
    /// (point-in-time snapshot at query time). Products with zero on-hand stock are excluded.
    ///
    /// <b>Issued units</b> counts only <c>Issue</c>-type stock movements with a confirmed status
    /// (<c>Active</c> or <c>Approved</c>) whose <c>CreatedAt</c> falls within the date range.
    ///
    /// <b>Classification thresholds (annualised):</b>
    /// <list type="bullet">
    ///   <item><c>FastMoving</c> — turnover ratio &gt; 12 turns per year.</item>
    ///   <item><c>SlowMoving</c> — turnover ratio &lt; 2 turns per year.</item>
    ///   <item><c>Normal</c>     — turnover ratio between 2 and 12 (inclusive).</item>
    /// </list>
    ///
    /// When neither <c>fromDate</c> nor <c>toDate</c> is supplied, the endpoint defaults
    /// to the last 90 days ending at the current UTC time.
    /// </remarks>
    /// <param name="query">Optional date range. Both dates default to the last 90 days when omitted.</param>
    /// <param name="cancellationToken">Token used to cancel the request.</param>
    /// <returns>
    /// A <see cref="TurnoverReportResponse"/> containing the effective date range,
    /// the number of calendar days covered, and per-product turnover data ordered
    /// by turnover ratio descending.
    /// </returns>
    [HttpGet("turnover")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetTurnover([FromQuery] TurnoverQueryParams query, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(query, nameof(query));

        var toDate = EnsureUtc(query.ToDate ?? DateTime.UtcNow);
        var fromDate = EnsureUtc(query.FromDate ?? toDate.AddDays(-90));

        if (fromDate > toDate)
        {
            return BadRequest("fromDate must not be later than toDate.");
        }

        var result = await reportsService.GetTurnoverAsync(fromDate, toDate, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Returns the FIFO-based stock valuation for every product that currently holds on-hand stock.
    /// </summary>
    /// <remarks>
    /// <b>FIFO cost method:</b> Under FIFO, the oldest units are consumed first, so the
    /// remaining on-hand stock is priced at the cost of the most recent purchase-order receipts.
    /// When a product has no purchase-order history the product's <c>CostPrice</c> field is
    /// used as the fallback unit cost.
    ///
    /// <b>Filters:</b>
    /// <list type="bullet">
    ///   <item><c>warehouseId</c> — restricts on-hand quantities to stock held in that warehouse.</item>
    ///   <item><c>categoryId</c> — restricts rows to products belonging to that category.</item>
    /// </list>
    ///
    /// The response includes a <c>grandTotal</c> which is the sum of all per-product
    /// <c>totalValue</c> figures.
    /// </remarks>
    /// <param name="query">Optional warehouse and category filters.</param>
    /// <param name="cancellationToken">Token used to cancel the request.</param>
    /// <returns>
    /// An <see cref="InventoryValuationResponse"/> with per-product rows ordered by SKU
    /// and a grand total.
    /// </returns>
    [HttpGet("inventory-valuation")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetInventoryValuation([FromQuery] InventoryValuationQueryParams query, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(query);

        var result = await reportsService.GetInventoryValuationAsync(query.WarehouseId, query.CategoryId, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Exports the inventory-valuation report as a UTF-8 CSV file.
    /// Accepts the same optional <c>warehouseId</c> and <c>categoryId</c> filters as
    /// <c>GET /api/v1/reports/inventory-valuation</c>.
    /// </summary>
    /// <param name="query">Optional warehouse and category filters.</param>
    /// <param name="cancellationToken">Token used to cancel the request.</param>
    /// <returns>A <c>text/csv</c> file named <c>inventory-valuation.csv</c>.</returns>
    [HttpGet("inventory-valuation/export")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> ExportInventoryValuationCsv([FromQuery] InventoryValuationQueryParams query, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(query);

        var result = await reportsService.GetInventoryValuationAsync(query.WarehouseId, query.CategoryId, cancellationToken);
        var csvBytes = BuildCsvBytes(result);
        return File(csvBytes, "text/csv", "inventory-valuation.csv");
    }

    private static byte[] BuildCsvBytes(InventoryValuationResponse report)
    {
        var sb = new StringBuilder();
        sb.AppendLine("SKU,Name,Category,TotalQuantity,UnitCost,TotalValue");

        foreach (var item in report.Items)
        {
            sb.Append(EscapeCsvField(item.SKU)).Append(',');
            sb.Append(EscapeCsvField(item.Name)).Append(',');
            sb.Append(EscapeCsvField(item.Category)).Append(',');
            sb.Append(item.TotalQuantity.ToString(CultureInfo.InvariantCulture)).Append(',');
            sb.Append(item.UnitCost.ToString(CultureInfo.InvariantCulture)).Append(',');
            sb.AppendLine(item.TotalValue.ToString(CultureInfo.InvariantCulture));
        }

        sb.Append(",,,,Grand Total,");
        sb.AppendLine(report.GrandTotal.ToString(CultureInfo.InvariantCulture));

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    /// <summary>
    /// Exports the stock-movement report as a UTF-8 CSV file.
    /// Accepts the same filters as <c>GET /api/v1/reports/stock-movement/pdf</c>.
    /// </summary>
    /// <param name="queryParams">
    /// Optional date range, warehouse, movement-type, status, and product filters.
    /// </param>
    /// <param name="cancellationToken">Token used to cancel the request.</param>
    /// <returns>A <c>text/csv</c> file named <c>stock-movement-YYYY-MM-DD.csv</c>.</returns>
    [HttpGet("stock-movement/export")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> ExportStockMovementCsv(
        [FromQuery] StockMovementReportQueryParams queryParams,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(queryParams);

        var report = await reportsService.GetStockMovementReportAsync(queryParams, cancellationToken);
        var csvBytes = BuildStockMovementCsvBytes(report);
        var fileName = $"stock-movement-{DateTime.UtcNow:yyyy-MM-dd}.csv";
        return File(csvBytes, "text/csv", fileName);
    }

    private const int StockMovementCsvColumnCount = 11;

    private static string PadStockMovementCsvRow(params string[] fields)
    {
        var sb = new StringBuilder();
        for (var i = 0; i < StockMovementCsvColumnCount; i++)
        {
            if (i > 0) sb.Append(',');
            if (i < fields.Length) sb.Append(fields[i]);
        }
        return sb.ToString();
    }

    private static byte[] BuildStockMovementCsvBytes(StockMovementReportResponse report)
    {
        var sb = new StringBuilder();
        sb.AppendLine("CreatedAt,Reference,Product,SKU,Type,Quantity,Source,Destination,Status,PerformedBy,Notes");

        foreach (var row in report.Items)
        {
            sb.Append(row.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture)).Append(',');
            sb.Append(EscapeCsvField(row.ReferenceNumber ?? string.Empty)).Append(',');
            sb.Append(EscapeCsvField(row.ProductName)).Append(',');
            sb.Append(EscapeCsvField(row.SKU)).Append(',');
            sb.Append(EscapeCsvField(row.MovementType)).Append(',');
            sb.Append(row.Quantity.ToString(CultureInfo.InvariantCulture)).Append(',');
            sb.Append(EscapeCsvField(row.SourceWarehouse ?? string.Empty)).Append(',');
            sb.Append(EscapeCsvField(row.DestinationWarehouse ?? string.Empty)).Append(',');
            sb.Append(EscapeCsvField(row.Status)).Append(',');
            sb.Append(EscapeCsvField(row.PerformedBy)).Append(',');
            sb.AppendLine(EscapeCsvField(row.Notes ?? string.Empty));
        }

        sb.AppendLine(PadStockMovementCsvRow());
        sb.AppendLine(PadStockMovementCsvRow(EscapeCsvField("Counts by type:")));
        foreach (var pair in report.CountsByType.OrderBy(p => p.Key, StringComparer.Ordinal))
        {
            sb.AppendLine(PadStockMovementCsvRow(
                EscapeCsvField(pair.Key),
                pair.Value.ToString(CultureInfo.InvariantCulture)));
        }

        sb.AppendLine(PadStockMovementCsvRow());
        sb.AppendLine(PadStockMovementCsvRow(EscapeCsvField("Counts by status:")));
        foreach (var pair in report.CountsByStatus.OrderBy(p => p.Key, StringComparer.Ordinal))
        {
            sb.AppendLine(PadStockMovementCsvRow(
                EscapeCsvField(pair.Key),
                pair.Value.ToString(CultureInfo.InvariantCulture)));
        }

        sb.AppendLine(PadStockMovementCsvRow());
        sb.AppendLine(PadStockMovementCsvRow(
            "Total quantity moved",
            report.TotalQuantityMoved.ToString(CultureInfo.InvariantCulture)));

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    /// <summary>
    /// Exports the product-turnover report as a UTF-8 CSV file.
    /// Accepts the same optional <c>fromDate</c> / <c>toDate</c> filters as
    /// <c>GET /api/v1/reports/turnover</c>.
    /// </summary>
    /// <param name="query">Optional date range; defaults to the last 90 days when omitted.</param>
    /// <param name="cancellationToken">Token used to cancel the request.</param>
    /// <returns>A <c>text/csv</c> file named <c>product-turnover-YYYY-MM-DD.csv</c>.</returns>
    [HttpGet("turnover/export")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ExportTurnoverCsv(
        [FromQuery] TurnoverQueryParams query,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(query);

        var toDate = EnsureUtc(query.ToDate ?? DateTime.UtcNow);
        var fromDate = EnsureUtc(query.FromDate ?? toDate.AddDays(-90));

        if (fromDate > toDate)
        {
            return BadRequest("fromDate must not be later than toDate.");
        }

        var report = await reportsService.GetTurnoverAsync(fromDate, toDate, cancellationToken);
        var csvBytes = BuildTurnoverCsvBytes(report);
        var fileName = $"product-turnover-{DateTime.UtcNow:yyyy-MM-dd}.csv";
        return File(csvBytes, "text/csv", fileName);
    }

    private const int TurnoverCsvColumnCount = 6;

    private static string PadTurnoverCsvRow(params string[] fields)
    {
        var sb = new StringBuilder();
        for (var i = 0; i < TurnoverCsvColumnCount; i++)
        {
            if (i > 0) sb.Append(',');
            if (i < fields.Length) sb.Append(fields[i]);
        }
        return sb.ToString();
    }

    private static byte[] BuildTurnoverCsvBytes(TurnoverReportResponse report)
    {
        var sb = new StringBuilder();
        sb.AppendLine("SKU,Name,TotalUnitsIssued,AverageStockLevel,TurnoverRatio,Classification");

        foreach (var item in report.Items)
        {
            sb.Append(EscapeCsvField(item.SKU)).Append(',');
            sb.Append(EscapeCsvField(item.ProductName)).Append(',');
            sb.Append(item.TotalUnitsIssued.ToString(CultureInfo.InvariantCulture)).Append(',');
            sb.Append(item.AverageStockLevel.ToString(CultureInfo.InvariantCulture)).Append(',');
            sb.Append(item.TurnoverRatio.ToString(CultureInfo.InvariantCulture)).Append(',');
            sb.AppendLine(EscapeCsvField(item.Classification));
        }

        sb.AppendLine(PadTurnoverCsvRow());
        sb.AppendLine(PadTurnoverCsvRow("From", report.FromDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)));
        sb.AppendLine(PadTurnoverCsvRow("To", report.ToDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)));
        sb.AppendLine(PadTurnoverCsvRow("Days in period", report.DaysInPeriod.ToString(CultureInfo.InvariantCulture)));

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    private static string EscapeCsvField(string value)
    {
        if (value.Contains(',') || value.Contains('"') || value.Contains('\n'))
        {
            return $"\"{value.Replace("\"", "\"\"")}\"";
        }

        return value;
    }

    private static DateTime EnsureUtc(DateTime value) =>
        value.Kind == DateTimeKind.Utc ? value : DateTime.SpecifyKind(value, DateTimeKind.Utc);
}
