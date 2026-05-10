using InvenTU.Core.Contracts.Repositories;
using InvenTU.Core.Contracts.Services;
using InvenTU.Core.DTOs.Alerts;
using InvenTU.Core.Entities;
using InvenTU.Core.Enums;

namespace InvenTU.Application.Alerts;

public sealed class AlertService(
    IAlertRepository alertRepository,
    IUserRepository userRepository,
    IAlertNotificationService alertNotificationService) : IAlertService
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

            // Push live notification to each targeted user.
            // Runs after the DB write succeeds — partial SignalR failures are
            // logged inside NotifyUsersAsync and never throw here.
            await alertNotificationService.NotifyUsersAsync(new AlertLiveDto
            {
                AlertId = alertId,
                AlertType = alertType.ToString(),
                Message = message,
                WarehouseId = warehouseId,
                IsRead = false,
                CreatedAt = DateTimeOffset.UtcNow,
            }, userIds, cancellationToken);
        }
    }

    public async Task CreateProductAlertAsync(
        AlertType alertType,
        string message,
        Guid productId,
        decimal currentQuantity,
        int minStockLevel,
        decimal? reorderSuggestion,
        CancellationToken ct = default)
    {
        var alert = new Alert
        {
            Id = Guid.NewGuid(),
            AlertType = alertType,
            ProductId = productId,
            CurrentQuantity = currentQuantity,
            MinStockLevel = minStockLevel,
            Message = message,
            CreatedAt = DateTime.UtcNow,
            ReorderSuggestion = reorderSuggestion,
        };

        var alertId = await alertRepository.CreateAsync(alert, ct);

        var userIds = new List<Guid>();
        userIds.AddRange(await userRepository.GetUserIdsByRoleAsync("Manager", ct));
        userIds.AddRange(await userRepository.GetUserIdsByRoleAsync("Admin", ct));

        userIds = userIds
            .Distinct()
            .ToList();

        if (userIds.Count > 0)
        {
            await alertRepository.CreateUserStatesAsync(alertId, userIds, ct);
            await alertNotificationService.NotifyUsersAsync(new AlertLiveDto
            {
                AlertId = alertId,
                AlertType = alertType.ToString(),
                Message = message,
                ProductId = productId,
                CurrentQuantity = currentQuantity,
                MinStockLevel = minStockLevel,
                IsRead = false,
                CreatedAt = DateTimeOffset.UtcNow,
            }, userIds, ct);
        }
    }

    public Task<IReadOnlyList<AlertLiveDto>> GetMyAlertsAsync(Guid userId, CancellationToken ct = default)
        => alertRepository.GetLiveForUserAsync(userId, limit: 100, ct);

    public Task MarkReadAsync(Guid userId, Guid alertId, CancellationToken ct = default)
        => alertRepository.MarkReadAsync(userId, alertId, ct);

    public Task MarkAllReadAsync(Guid userId, CancellationToken ct = default)
        => alertRepository.MarkAllReadAsync(userId, ct);
}
