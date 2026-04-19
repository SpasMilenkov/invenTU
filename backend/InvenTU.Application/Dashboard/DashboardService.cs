using InvenTU.Core.Contracts.Repositories;
using InvenTU.Core.Contracts.Services;
using InvenTU.Core.DTOs.Dashboard;

namespace InvenTU.Application.Services;

/// <summary>
/// Orchestrates repository calls to assemble the dashboard statistics response.
/// </summary>
/// <remarks>
/// <para>
/// The four repository methods are called sequentially rather than via
/// <c>Task.WhenAll</c> because EF Core's <c>DbContext</c> is not safe for
/// concurrent operations from multiple threads. Sequential execution still
/// issues the minimum number of SQL round-trips (four total) and is fast
/// enough for the sub-second SLA given that each query is individually
/// optimised with aggregation on the database side.
/// </para>
/// <para>
/// Should profiling reveal that parallelism is necessary, the correct approach
/// is to inject <c>IDbContextFactory&lt;InvenTUDbContext&gt;</c> into the
/// repository and resolve a separate context per query — not to share a single
/// context across concurrent tasks.
/// </para>
/// </remarks>
public sealed class DashboardService(IDashboardRepository dashboardRepository) : IDashboardService
{
    /// <inheritdoc />
    public async Task<DashboardStatsDto> GetStatsAsync(CancellationToken cancellationToken = default)
    {
        // Round-trip 1: three scalar product/stock metrics in one SQL query.
        var (totalProducts, lowStockCount, totalStockValue) =
            await dashboardRepository.GetScalarMetricsAsync(cancellationToken);

        // Round-trip 2: simple COUNT over Warehouses.
        var totalWarehouses =
            await dashboardRepository.GetActiveWarehouseCountAsync(cancellationToken);

        // Round-trip 3: last 10 stock movements with product name + SKU.
        var recentMovements =
            await dashboardRepository.GetRecentMovementsAsync(10, cancellationToken);

        // Round-trip 4: top 8 categories by total stock quantity.
        var stockByCategory =
            await dashboardRepository.GetStockByCategoryAsync(8, cancellationToken);

        return new DashboardStatsDto
        {
            TotalProducts   = totalProducts,
            TotalWarehouses = totalWarehouses,
            LowStockCount   = lowStockCount,
            TotalStockValue = totalStockValue,
            RecentMovements = recentMovements,
            StockByCategory = stockByCategory,
        };
    }
}
