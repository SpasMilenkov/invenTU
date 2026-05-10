using InvenTU.Core.Contracts.Repositories;
using InvenTU.Core.Contracts.Services;
using InvenTU.Core.DTOs.Reports;

namespace InvenTU.Application.Reports;

/// <summary>
/// Application-layer implementation of <see cref="IReportsService"/>.
/// Delegates data access to <see cref="IReportsRepository"/> and applies
/// the turnover ratio formula and fast/slow-moving classification logic.
/// </summary>
public sealed class ReportsService(IReportsRepository reportsRepository) : IReportsService
{
    /// <summary>
    /// Annualised turnover ratio above which a product is classified as fast-moving.
    /// </summary>
    private const decimal FastMovingThreshold = 12m;

    /// <summary>
    /// Annualised turnover ratio below which a product is classified as slow-moving.
    /// </summary>
    private const decimal SlowMovingThreshold = 2m;

    /// <inheritdoc />
    public async Task<TurnoverReportResponse> GetTurnoverAsync(DateTime fromDate, DateTime toDate, CancellationToken cancellationToken)
    {
        var rawData = await reportsRepository.GetTurnoverDataAsync(fromDate, toDate, cancellationToken);

        var daysInPeriod = Math.Max(1, (int)Math.Ceiling((toDate - fromDate).TotalDays));
        var annualisationFactor = 365m / daysInPeriod;

        var items = rawData
            .Select(d => ToDto(d, annualisationFactor))
            .OrderByDescending(d => d.TurnoverRatio)
            .ToList();

        return new TurnoverReportResponse
        {
            FromDate = fromDate,
            ToDate = toDate,
            DaysInPeriod = daysInPeriod,
            Items = items,
        };
    }

    /// <summary>
    /// Converts a single raw data record into a <see cref="ProductTurnoverDto"/>,
    /// computing the annualised turnover ratio and applying the classification rules.
    /// </summary>
    private static ProductTurnoverDto ToDto(ProductTurnoverData data, decimal annualisationFactor)
    {
        // Period turnover = units issued ÷ average stock level.
        // AverageStockLevel is guaranteed > 0 by the repository filter.
        var periodTurnover = data.TotalUnitsIssued / data.AverageStockLevel;
        var annualisedRatio = Math.Round(periodTurnover * annualisationFactor, 4);

        var classification = annualisedRatio > FastMovingThreshold
            ? "FastMoving"
            : annualisedRatio < SlowMovingThreshold
                ? "SlowMoving"
                : "Normal";

        return new ProductTurnoverDto
        {
            ProductId = data.ProductId,
            ProductName = data.ProductName,
            SKU = data.SKU,
            TotalUnitsIssued = data.TotalUnitsIssued,
            AverageStockLevel = data.AverageStockLevel,
            TurnoverRatio = annualisedRatio,
            Classification = classification,
        };
    }
}
