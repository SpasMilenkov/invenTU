using InvenTU.Core.DTOs.Stats;

namespace InvenTU.Core.Contracts.Repositories;

/// <summary>
/// Data-access contract for dashboard statistics queries.
/// Implementations execute read-only aggregation queries directly against the database.
/// </summary>
public interface IStatsRepository
{
    /// <summary>
    /// Returns raw inventory health figures: active product count, total on-hand stock
    /// value, number of products below their reorder point, total stock units, and the
    /// total number of bin-level stock locations across all warehouses.
    /// </summary>
    /// <param name="cancellationToken">Token used to cancel the database query.</param>
    Task<InventoryHealthData> GetInventoryHealthAsync(CancellationToken cancellationToken);

    /// <summary>
    /// Returns unresolved alert counts in aggregate, broken down by alert type, and
    /// scoped to the calling user for the per-user unread count.
    /// </summary>
    /// <param name="userId">
    /// The authenticated user's id used to calculate <c>UnreadForCurrentUser</c>.
    /// </param>
    /// <param name="cancellationToken">Token used to cancel the database query.</param>
    Task<AlertSummaryData> GetAlertSummaryAsync(Guid userId, CancellationToken cancellationToken);

    /// <summary>
    /// Returns purchase order pipeline figures: count and total value of open orders,
    /// plus a full status distribution across all orders.
    /// </summary>
    /// <param name="cancellationToken">Token used to cancel the database query.</param>
    Task<PurchaseOrderPipelineData> GetPurchaseOrderPipelineAsync(CancellationToken cancellationToken);

    /// <summary>Returns public-facing counts shown on the auth/marketing shell.</summary>
    Task<PublicSummaryData> GetPublicSummaryAsync(CancellationToken cancellationToken);
}

/// <summary>Raw inventory health data fetched from the database.</summary>
/// <param name="TotalActiveProducts">Active, non-deleted product count.</param>
/// <param name="TotalStockValue">Sum of quantity × cost price across all stock items.</param>
/// <param name="ProductsBelowReorderPoint">Products whose on-hand total is at or below their reorder point.</param>
/// <param name="TotalStockUnits">Sum of all stock item quantities.</param>
/// <param name="TotalStockLocations">Count of all bin-level stock locations.</param>
public sealed record InventoryHealthData(
    int TotalActiveProducts,
    decimal TotalStockValue,
    int ProductsBelowReorderPoint,
    decimal TotalStockUnits,
    int TotalStockLocations);

/// <summary>Raw alert summary data fetched from the database.</summary>
/// <param name="TotalUnresolved">Alerts with a null <c>ResolvedAt</c>.</param>
/// <param name="UnreadForCurrentUser">Unresolved alerts the calling user has not read.</param>
/// <param name="ByType">AlertType → count for all unresolved alerts.</param>
public sealed record AlertSummaryData(
    int TotalUnresolved,
    int UnreadForCurrentUser,
    Dictionary<string, int> ByType);

/// <summary>Raw purchase order pipeline data fetched from the database.</summary>
/// <param name="TotalOpenOrders">Non-terminal purchase order count.</param>
/// <param name="TotalOpenValue">Combined line-item value of all open orders.</param>
/// <param name="ByStatus">Status → count across all purchase orders.</param>
public sealed record PurchaseOrderPipelineData(
    int TotalOpenOrders,
    decimal TotalOpenValue,
    Dictionary<string, int> ByStatus);
