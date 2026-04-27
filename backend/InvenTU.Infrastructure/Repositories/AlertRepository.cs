using InvenTU.Core.Contracts.Repositories;
using InvenTU.Core.Entities;
using InvenTU.Core.Enums;
using InvenTU.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InvenTU.Infrastructure.Repositories;

public sealed class AlertRepository(InvenTUDbContext dbContext) : IAlertRepository
{
    public async Task<Alert?> UnresolvedAlertForProductAsync(Guid productId, AlertType alertType, CancellationToken cancellationToken = default)
    {
        return await dbContext.Alerts
            .FirstOrDefaultAsync(a => a.ProductId == productId
                    && a.AlertType == alertType
                    && a.ResolvedAt == null,
                    cancellationToken);
    }

    public async Task<Guid> CreateAsync(Alert alert, CancellationToken cancellationToken = default)
    {
        dbContext.Alerts.Add(alert);
        await dbContext.SaveChangesAsync(cancellationToken);
        return alert.Id;
    }

    public async Task CreateUserStatesAsync(
        Guid alertId,
        IEnumerable<Guid> userIds,
        CancellationToken cancellationToken = default)
    {
        var states = userIds.Select(uid => new AlertUserState
        {
            AlertId = alertId,
            UserId = uid,
            IsRead = false,
            SnoozedUntil = null,
        });

        dbContext.AlertUserStates.AddRange(states);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task ResolveAsync(Guid alertId, CancellationToken cancellationToken = default)
    {
        var alertToResolve = await dbContext.Alerts.FirstOrDefaultAsync(alert => alert.Id == alertId)
            ?? throw new InvalidOperationException("Alert not found and can't be resolved");
        alertToResolve.ResolvedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
