using InvenTU.Core.Entities;

namespace InvenTU.Core.Contracts.Repositories;

public interface IRefreshTokenStore
{
    Task SaveAsync(RefreshToken token, CancellationToken cancellationToken = default);
    Task<RefreshToken?> GetByTokenAsync(string token, CancellationToken cancellationToken = default);
    Task RevokeAsync(RefreshToken token, CancellationToken cancellationToken = default);
    Task RevokeAllForUserAsync(Guid userId, CancellationToken cancellationToken = default);
}
