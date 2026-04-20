using InvenTU.Core.Contracts.Repositories;
using InvenTU.Core.Contracts.Services;
using InvenTU.Core.Entities;
using InvenTU.Core.Enums;

namespace InvenTU.Application.Alerts;

public sealed class AlertService(
    IAlertRepository alertRepository,
    IUserRepository userRepository) : IAlertService
{
    public async Task CreateSystemAlertForRoleAsync(
        AlertType alertType,
        string message,
        Guid? warehouseId,
        string targetRole,
        CancellationToken cancellationToken = default)
    {
        var alert = new Alert
        {
            Id = Guid.NewGuid(),
            AlertType = alertType,
            WarehouseId = warehouseId,
            Message = message,
            CreatedAt = DateTime.UtcNow,
        };

        var alertId = await alertRepository.CreateAsync(alert, cancellationToken);

        var userIds = await userRepository.GetUserIdsByRoleAsync(targetRole, cancellationToken);
        if (userIds.Count > 0)
        {
            await alertRepository.CreateUserStatesAsync(alertId, userIds, cancellationToken);
        }
    }
}
