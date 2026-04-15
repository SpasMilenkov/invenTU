using InvenTU.Core.Contracts.Repositories;
using InvenTU.Core.Contracts.Services;
using InvenTU.Core.DTOs.Auth;
using InvenTU.Core.Entities;
using Microsoft.AspNetCore.Identity;

namespace InvenTU.Application.Auth;

public sealed class AuthService(
    ITokenService tokenService,
    IRefreshTokenStore refreshTokenStore,
    UserManager<User> userManager) : IAuthService
{
    private readonly ITokenService _tokenService = tokenService;
    private readonly IRefreshTokenStore _refreshTokenStore = refreshTokenStore;
    private readonly UserManager<User> _userManager = userManager;

    public async Task<LoginResultDTO> LoginAsync(LoginDTO loginDto)
    {
        ArgumentNullException.ThrowIfNull(loginDto, nameof(loginDto));

        if (string.IsNullOrWhiteSpace(loginDto.Email) || string.IsNullOrWhiteSpace(loginDto.Password))
        {
            return new LoginResultDTO { ErrorMessage = "Email and password are required." };
        }

        var result = new LoginResultDTO();

        var user = await _userManager.FindByEmailAsync(loginDto.Email);

        if (user != null && await _userManager.CheckPasswordAsync(user, loginDto.Password))
        {
            if (!user.IsActive)
            {
                result.ErrorMessage = "Account is disabled";
                return result;
            }

            var roles = await _userManager.GetRolesAsync(user);
            result.AccessToken = _tokenService.GenerateAccessToken(user, roles);
            result.RefreshToken = await _tokenService.CreateRefreshTokenAsync(user.Id);
            result.UserName = user.UserName;
            result.Id = user.Id;
            result.Email = user.Email;
            result.Roles = roles;
        }

        return result;
    }

    public async Task<IdentityResult> RegisterAsync(RegisterDTO registerDto)
    {
        ArgumentNullException.ThrowIfNull(registerDto, nameof(registerDto));

        var firstName = registerDto.FirstName ?? string.Empty;
        var lastName = registerDto.LastName ?? string.Empty;
        var email = registerDto.Email ?? string.Empty;
        var password = registerDto.Password ?? string.Empty;

        var newUser = new User
        {
            UserName = firstName + lastName,
            Email = email,
            FirstName = firstName,
            LastName = lastName,
        };

        var result = await _userManager.CreateAsync(newUser, password);

        // Give user the default Worker role
        if (result.Succeeded)
            await _userManager.AddToRoleAsync(newUser, "Worker");

        return result;
    }

    public async Task<LoginResultDTO> RefreshAsync(string refreshToken, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(refreshToken);

        var result = new LoginResultDTO();

        var token = await _refreshTokenStore.GetByTokenAsync(refreshToken, cancellationToken);

        if (token is null || token.RevokedAt is not null || token.ExpiresAt <= DateTime.UtcNow)
        {
            result.ErrorMessage = "Invalid or expired refresh token";
            return result;
        }

        var user = await _userManager.FindByIdAsync(token.UserId.ToString());

        if (user is null)
        {
            result.ErrorMessage = "User not found";
            return result;
        }

        if (!user.IsActive)
        {
            result.ErrorMessage = "Account is disabled";
            return result;
        }

        var roles = await _userManager.GetRolesAsync(user);
        result.AccessToken = _tokenService.GenerateAccessToken(user, roles);
        result.RefreshToken = await _tokenService.RotateRefreshTokenAsync(user, refreshToken, cancellationToken);
        result.UserName = user.UserName;
        result.Id = user.Id;
        result.Email = user.Email;
        result.Roles = roles;

        return result;
    }

    public async Task LogoutAsync(string refreshToken, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(refreshToken);

        var token = await _refreshTokenStore.GetByTokenAsync(refreshToken, cancellationToken);

        if (token is not null && token.RevokedAt is null)
            await _refreshTokenStore.RevokeAsync(token, cancellationToken);
    }
}
