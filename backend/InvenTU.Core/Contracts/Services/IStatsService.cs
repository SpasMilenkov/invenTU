using InvenTU.Core.DTOs.Stats;

namespace InvenTU.Core.Contracts.Services;

/// <summary>
/// Application-layer contract for dashboard statistics.
/// Orchestrates data from <see cref="IStatsRepository"/> and maps raw database
/// projections to the API response DTOs.
/// </summary>
public interface IStatsService
{
    /// <summary>
    /// Returns a snapshot of overall inventory health including active product count,
    /// aggregated stock value, reorder alerts, total on-hand units, and bin location count.
    /// </summary>
    /// <param name="cancellationToken">Token used to cancel the operation.</param>
    /// <returns>A populated <see cref="InventoryHealthResponse"/>.</returns>
    Task<InventoryHealthResponse> GetInventoryHealthAsync(CancellationToken cancellationToken);

    /// <summary>
    /// Returns a summary of unresolved alerts system-wide, with a per-user unread count
    /// personalised to the authenticated caller and a breakdown by alert type.
    /// </summary>
    /// <param name="userId">The authenticated user's id for the per-user unread count.</param>
    /// <param name="cancellationToken">Token used to cancel the operation.</param>
    /// <returns>A populated <see cref="AlertSummaryResponse"/>.</returns>
    Task<AlertSummaryResponse> GetAlertSummaryAsync(Guid userId, CancellationToken cancellationToken);

    /// <summary>
    /// Returns the purchase order pipeline: count and total value of open orders plus a
    /// full status distribution across all orders.
    /// </summary>
    /// <param name="cancellationToken">Token used to cancel the operation.</param>
    /// <returns>A populated <see cref="PurchaseOrderPipelineResponse"/>.</returns>
    Task<PurchaseOrderPipelineResponse> GetPurchaseOrderPipelineAsync(CancellationToken cancellationToken);
    
    Task<PublicSummaryResponse> GetPublicSummaryAsync(CancellationToken cancellationToken);
}
