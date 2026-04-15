using InvenTU.Core.DTOs.Auth;
using Microsoft.AspNetCore.Identity;

namespace InvenTU.Core.Contracts.Services;

public interface IAuthService
{
    Task<LoginResultDTO> LoginAsync(LoginDTO loginDto);
    Task<IdentityResult> RegisterAsync(RegisterDTO registerDto);
    Task<LoginResultDTO> RefreshAsync(string refreshToken, CancellationToken cancellationToken = default);
    Task LogoutAsync(string refreshToken, CancellationToken cancellationToken = default);
}
