using InvenTU.Core.Entities;

namespace InvenTU.Core.Contracts.Repositories;

public interface IAlertRepository
{
    Task<Guid> CreateAsync(Alert alert, CancellationToken cancellationToken = default);
    Task CreateUserStatesAsync(Guid alertId, IEnumerable<Guid> userIds, CancellationToken cancellationToken = default);
}
