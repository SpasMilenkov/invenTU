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

    /// <summary>

}
