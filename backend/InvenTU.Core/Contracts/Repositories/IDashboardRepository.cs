using InvenTU.Core.DTOs.Dashboard;

namespace InvenTU.Core.Contracts.Repositories;

/// <summary>
/// Defines data-access operations required to populate the dashboard statistics
/// endpoint. Each method maps to a single database round-trip so the service
/// layer can reason about cost explicitly.
/// </summary>
public interface IDashboardRepository
{
    /// <summary>
    /// Returns the three scalar product/stock metrics in a single SQL query.
    /// Combining them avoids a triple scan of the <c>Products</c> and
    /// <c>StockItems</c> tables.
    /// </summary>
    /// <param name="cancellationToken">Propagates a cancellation signal.</param>
    /// <returns>
    /// A value tuple containing:
    /// <list type="bullet">
    ///   <item><description><c>TotalProducts</c> — count of active, non-deleted products.</description></item>
    ///   <item><description><c>LowStockCount</c> — active products whose total stock is below <c>MinStockLevel</c>.</description></item>
    ///   <item><description><c>TotalStockValue</c> — sum of (total quantity × cost price) for all active products.</description></item>
    /// </list>
    /// </returns>
    Task<(int TotalProducts, int LowStockCount, decimal TotalStockValue)> GetScalarMetricsAsync(
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns the count of warehouses with <c>IsActive = true</c>.
    /// </summary>
    /// <param name="cancellationToken">Propagates a cancellation signal.</param>
    Task<int> GetActiveWarehouseCountAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns the <paramref name="count"/> most recently created stock movements,
    /// each projected with product name and SKU. Ordered newest-first.
    /// </summary>
    /// <param name="count">Maximum number of movements to return.</param>
    /// <param name="cancellationToken">Propagates a cancellation signal.</param>
    Task<IReadOnlyList<RecentMovementDto>> GetRecentMovementsAsync(
        int count,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns the top <paramref name="topN"/> categories ranked by total stock
    /// quantity (descending). Only stock for active, non-deleted products is counted.
    /// </summary>
    /// <param name="topN">Maximum number of categories to return.</param>
    /// <param name="cancellationToken">Propagates a cancellation signal.</param>
    Task<IReadOnlyList<StockByCategoryDto>> GetStockByCategoryAsync(
        int topN,
        CancellationToken cancellationToken = default);
}
