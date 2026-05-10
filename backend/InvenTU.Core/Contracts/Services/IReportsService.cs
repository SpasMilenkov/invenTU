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
}
