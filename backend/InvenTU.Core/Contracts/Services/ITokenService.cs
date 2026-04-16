using InvenTU.Core.Entities;

namespace InvenTU.Core.Contracts.Services;

public interface ITokenService
{
    string GenerateAccessToken(User user, IList<string> roles);
    Task<string> CreateRefreshTokenAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<string> RotateRefreshTokenAsync(User user, string oldToken, CancellationToken cancellationToken = default);
}
