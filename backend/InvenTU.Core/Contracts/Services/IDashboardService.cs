using InvenTU.Core.DTOs.Dashboard;

namespace InvenTU.Core.Contracts.Services;

/// <summary>
/// Defines the application-layer contract for retrieving dashboard statistics.
/// Implementations are responsible for orchestrating repository calls and
/// assembling the composite <see cref="DashboardStatsDto"/> response.
/// </summary>
public interface IDashboardService
{
    /// <summary>
    /// Assembles and returns all dashboard statistics in a single call.
    /// The underlying implementation fetches metrics sequentially to avoid
    /// <see cref="System.Data.Common.DbConnection"/> concurrency issues while
    /// still issuing the minimum number of database round-trips.
    /// </summary>
    /// <param name="cancellationToken">Propagates a cancellation signal.</param>
    /// <returns>
    /// A fully populated <see cref="DashboardStatsDto"/> containing product counts,
    /// warehouse counts, low-stock alerts, total stock value, the ten most recent
    /// movements, and the top eight categories by stock quantity.
    /// </returns>
    Task<DashboardStatsDto> GetStatsAsync(CancellationToken cancellationToken = default);
}
