using InvenTU.Core.Contracts.Repositories;
using InvenTU.Core.Contracts.Services;
using InvenTU.Core.DTOs.Stats;

namespace InvenTU.Application.Stats;

/// <summary>
/// Application-layer implementation of <see cref="IStatsService"/>.
/// Delegates all data access to <see cref="IStatsRepository"/> and maps the raw
/// database projections to the API response DTOs consumed by the controller.
/// </summary>
public sealed class StatsService(IStatsRepository statsRepository) : IStatsService
{
    /// <inheritdoc />
    public async Task<InventoryHealthResponse> GetInventoryHealthAsync(CancellationToken cancellationToken)
    {
        var data = await statsRepository.GetInventoryHealthAsync(cancellationToken);

        return new InventoryHealthResponse
        {
            TotalActiveProducts = data.TotalActiveProducts,
            TotalStockValue = data.TotalStockValue,
            ProductsBelowReorderPoint = data.ProductsBelowReorderPoint,
            TotalStockUnits = data.TotalStockUnits,
            TotalStockLocations = data.TotalStockLocations,
        };
    }

    /// <inheritdoc />
    public async Task<AlertSummaryResponse> GetAlertSummaryAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var data = await statsRepository.GetAlertSummaryAsync(userId, cancellationToken);

        return new AlertSummaryResponse
        {
            TotalUnresolved = data.TotalUnresolved,
            UnreadForCurrentUser = data.UnreadForCurrentUser,
            ByType = data.ByType,
        };
    }

    /// <inheritdoc />
    public async Task<PurchaseOrderPipelineResponse> GetPurchaseOrderPipelineAsync(
        CancellationToken cancellationToken)
    {
        var data = await statsRepository.GetPurchaseOrderPipelineAsync(cancellationToken);

        return new PurchaseOrderPipelineResponse
        {
            TotalOpenOrders = data.TotalOpenOrders,
            TotalOpenValue = data.TotalOpenValue,
            ByStatus = data.ByStatus,
        };
    }
    /// <inheritdoc />
    public async Task<PublicSummaryResponse> GetPublicSummaryAsync(CancellationToken cancellationToken)
    {
        var data = await statsRepository.GetPublicSummaryAsync(cancellationToken);
        return new PublicSummaryResponse
        {
            ActiveWarehouses = data.ActiveWarehouses,
            ActiveSkus = data.ActiveSkus,
            StockLocations = data.StockLocations,
        };
    }
}
