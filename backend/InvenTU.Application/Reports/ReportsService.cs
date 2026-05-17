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
            ? ProductTurnoverClassifications.FastMoving
            : annualisedRatio < SlowMovingThreshold
                ? ProductTurnoverClassifications.SlowMoving
                : ProductTurnoverClassifications.Normal;

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

    /// <inheritdoc />
    public async Task<InventoryValuationResponse> GetInventoryValuationAsync(Guid? warehouseId, Guid? categoryId, CancellationToken cancellationToken)
    {
        var raw = await reportsRepository.GetInventoryValuationDataAsync(warehouseId, categoryId, cancellationToken);

        // Group PO lines by product, sorted newest-first.
        // Under FIFO, the oldest units are consumed first, so the remaining on-hand
        // stock is priced using the most recent purchase receipts.
        var poLinesByProduct = raw.PoLines
            .GroupBy(l => l.ProductId)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(l => l.OrderDate).ToList());

        var items = raw.Products
            .Select(p =>
            {
                var unitCost = ComputeFifoUnitCost(p.OnHandQuantity, p.CostPrice,
                    poLinesByProduct.GetValueOrDefault(p.ProductId));
                var totalValue = Math.Round(p.OnHandQuantity * unitCost, 2);
                return new ProductValuationDto
                {
                    ProductId = p.ProductId,
                    SKU = p.SKU,
                    Name = p.Name,
                    Category = p.CategoryName,
                    TotalQuantity = p.OnHandQuantity,
                    UnitCost = unitCost,
                    TotalValue = totalValue,
                };
            })
            .OrderBy(x => x.SKU)
            .ToList();

        return new InventoryValuationResponse
        {
            Items = items,
            GrandTotal = Math.Round(items.Sum(i => i.TotalValue), 2),
            WarehouseId = warehouseId,
            CategoryId = categoryId,
        };
    }

    /// <inheritdoc />
    public async Task<StockMovementReportResponse> GetStockMovementReportAsync(
        StockMovementReportQueryParams queryParams,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(queryParams);

        var toDate = EnsureUtc(queryParams.ToDate ?? DateTime.UtcNow);
        var fromDate = EnsureUtc(queryParams.FromDate ?? toDate.AddDays(-30));

        var rows = await reportsRepository.GetStockMovementsForReportAsync(
            fromDate,
            toDate,
            queryParams.WarehouseId,
            queryParams.MovementType,
            queryParams.Status,
            queryParams.ProductId,
            cancellationToken);

        var countsByType = rows
            .GroupBy(r => r.MovementType)
            .ToDictionary(g => g.Key, g => g.Count());

        var countsByStatus = rows
            .GroupBy(r => r.Status)
            .ToDictionary(g => g.Key, g => g.Count());

        return new StockMovementReportResponse
        {
            GeneratedAt = DateTime.UtcNow,
            Filters = new StockMovementReportQueryParams
            {
                FromDate = fromDate,
                ToDate = toDate,
                WarehouseId = queryParams.WarehouseId,
                MovementType = queryParams.MovementType,
                Status = queryParams.Status,
                ProductId = queryParams.ProductId,
            },
            Items = rows,
            CountsByType = countsByType,
            CountsByStatus = countsByStatus,
            TotalQuantityMoved = rows.Sum(r => r.Quantity),
        };
    }

    /// <summary>
    /// Computes the FIFO unit cost for a product given its on-hand quantity and purchase-order cost layers.
    /// </summary>
    /// <remarks>
    /// FIFO means the oldest units are consumed first.  The on-hand stock therefore
    /// represents the <em>most recent</em> receipts.  Cost layers are walked newest→oldest
    /// until the on-hand quantity is fully priced; the result is a weighted average
    /// of those layers.  Falls back to <paramref name="fallbackCostPrice"/> when no
    /// purchase-order history exists for the product.
    /// </remarks>
    private static decimal ComputeFifoUnitCost(decimal onHandQty, decimal fallbackCostPrice, List<ProductPoLine>? poLines)
    {
        if (poLines is null || poLines.Count == 0)
        {
            return fallbackCostPrice;
        }

        var remaining = onHandQty;
        var totalCost = 0m;
        var totalAllocated = 0m;

        foreach (var layer in poLines) // already sorted newest-first by caller
        {
            if (remaining <= 0m) break;
            var qty = Math.Min(layer.Quantity, remaining);
            totalCost += qty * layer.UnitPrice;
            totalAllocated += qty;
            remaining -= qty;
        }

        return totalAllocated == 0m
            ? fallbackCostPrice
            : Math.Round(totalCost / totalAllocated, 6);
    }

    private static DateTime EnsureUtc(DateTime value) =>
        value.Kind == DateTimeKind.Utc ? value : DateTime.SpecifyKind(value, DateTimeKind.Utc);
}
