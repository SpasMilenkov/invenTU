using InvenTU.Core.DTOs.Alerts;
using InvenTU.Core.Enums;

namespace InvenTU.Core.Contracts.Services;

public interface IAlertService
{
    /// <summary>
    /// Creates a system-level alert and fans it out to all users
    /// in the specified role so it appears in their alert feed.
    /// </summary>
    Task CreateSystemAlertForRoleAsync(
        AlertType alertType,
        string message,
        Guid? warehouseId,
        string targetRole,
        CancellationToken cancellationToken = default);

    Task CreateProductAlertAsync(
        AlertType alertType,
        string message,
        Guid productId,
        decimal currentQuantity,
        int minStockLevel,
        decimal? reorderSuggestion,
        CancellationToken ct = default);
    /// <summary>
    Task<IReadOnlyList<AlertLiveDto>> GetMyAlertsAsync(Guid userId, CancellationToken ct = default);
    Task MarkReadAsync(Guid userId, Guid alertId, CancellationToken ct = default);
    Task MarkAllReadAsync(Guid userId, CancellationToken ct = default);
}
