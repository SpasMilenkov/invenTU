using InvenTU.Core.Contracts.Repositories;
using InvenTU.Core.Entities;
using InvenTU.Infrastructure.Data;

namespace InvenTU.Infrastructure.Repositories;

public sealed class AlertRepository(InvenTUDbContext dbContext) : IAlertRepository
{
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
}
