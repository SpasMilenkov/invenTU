using InvenTU.Core.DTOs.Alerts;
using InvenTU.Core.Entities;
using InvenTU.Core.Enums;

namespace InvenTU.Core.Contracts.Repositories;

// InvenTU.Core/Contracts/Repositories/IAlertRepository.cs  (additions only)
public interface IAlertRepository
{
    Task<Guid> CreateAsync(Alert alert, CancellationToken cancellationToken = default);
    Task CreateUserStatesAsync(Guid alertId, IEnumerable<Guid> userIds, CancellationToken cancellationToken = default);
    Task<Alert?> UnresolvedAlertForProductAsync(Guid productId, AlertType alertType, CancellationToken cancellationToken = default);
    Task ResolveAsync(Guid alertId, CancellationToken cancellationToken = default);
}
    Task<Guid> CreateAsync(Alert alert, CancellationToken ct = default);
    Task CreateUserStatesAsync(Guid alertId, IEnumerable<Guid> userIds, CancellationToken ct = default);

    // NEW
    Task<IReadOnlyList<AlertLiveDto>> GetLiveForUserAsync(
        Guid userId,
        int limit = 100,
        CancellationToken ct = default);

    Task<int> MarkReadAsync(Guid userId, Guid alertId, CancellationToken ct = default);
    Task<int> MarkAllReadAsync(Guid userId, CancellationToken ct = default);
}
