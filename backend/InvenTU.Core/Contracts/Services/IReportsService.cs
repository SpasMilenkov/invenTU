using InvenTU.Core.DTOs.Reports;

namespace InvenTU.Core.Contracts.Services;

/// <summary>
/// Application-layer contract for inventory reporting.
/// Orchestrates data from <see cref="IReportsRepository"/> and produces
/// the API response DTOs consumed by the controller.
/// </summary>
public interface IReportsService
{
    /// <summary>
    /// Computes the annualised inventory turnover ratio for every active product
    /// that currently holds stock, within the specified date range.
    /// Products with zero average stock are excluded.
    /// </summary>
    /// <param name="fromDate">Start of the reporting window (UTC, inclusive).</param>
    /// <param name="toDate">End of the reporting window (UTC, inclusive).</param>
    /// <param name="cancellationToken">Token used to cancel the operation.</param>
    /// <returns>
    /// A <see cref="TurnoverReportResponse"/> containing the effective date range
    /// and per-product turnover data ordered by ratio descending.
    /// </returns>
    Task<TurnoverReportResponse> GetTurnoverAsync(DateTime fromDate, DateTime toDate, CancellationToken cancellationToken);

    /// <summary>
    /// Computes the FIFO-based inventory valuation for all products that currently hold stock.
    /// </summary>
    /// <param name="warehouseId">When supplied, limits stock quantities to this warehouse.</param>
    /// <param name="categoryId">When supplied, limits products to this category.</param>
    /// <param name="cancellationToken">Token used to cancel the operation.</param>
    /// <returns>
    /// An <see cref="InventoryValuationResponse"/> containing per-product valuation rows
    /// and a grand total, ordered by SKU ascending.
    /// </returns>
    Task<InventoryValuationResponse> GetInventoryValuationAsync(Guid? warehouseId, Guid? categoryId, CancellationToken cancellationToken);

    /// <summary>
    /// Computes the stock-movement report response for the given filters.
    /// Resolves date defaults (last 30 days) when the inputs are omitted, fetches
    /// the matching movement rows from the repository, and pre-computes the
    /// summary aggregates consumed by both the PDF document and the CSV export.
    /// </summary>
    /// <param name="queryParams">
    /// Date range, warehouse, movement-type, status, and product filters.
    /// All fields are optional; omitted dates are resolved to sensible defaults
    /// before the query is executed.
    /// </param>
    /// <param name="cancellationToken">Token used to cancel the operation.</param>
    /// <returns>
    /// A <see cref="StockMovementReportResponse"/> containing the resolved filters,
    /// the matching movement rows ordered by <c>CreatedAt</c> descending, and
    /// pre-computed counts/totals.
    /// </returns>
    Task<StockMovementReportResponse> GetStockMovementReportAsync(
        StockMovementReportQueryParams queryParams,
        CancellationToken cancellationToken);
}
