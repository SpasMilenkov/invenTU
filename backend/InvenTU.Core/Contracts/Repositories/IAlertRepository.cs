using InvenTU.Core.Entities;
using InvenTU.Core.Enums;

namespace InvenTU.Core.Contracts.Repositories;

public interface IAlertRepository
{
    Task<Guid> CreateAsync(Alert alert, CancellationToken cancellationToken = default);
    Task CreateUserStatesAsync(Guid alertId, IEnumerable<Guid> userIds, CancellationToken cancellationToken = default);
    Task<Alert?> UnresolvedAlertForProductAsync(Guid productId, AlertType alertType, CancellationToken cancellationToken = default);
    Task ResolveAsync(Guid alertId, CancellationToken cancellationToken = default);
}
