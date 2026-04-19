using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using InvenTU.Core.Contracts.Repositories;
using InvenTU.Core.Contracts.Services;
using InvenTU.Core.Entities;
using InvenTU.Infrastructure.Settings;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace InvenTU.Infrastructure.Auth;

public sealed class TokenService(IOptions<JwtSettings> jwtOptions, IRefreshTokenStore refreshTokenStore) : ITokenService
{
    private readonly JwtSettings _jwt = jwtOptions.Value;

    public string GenerateAccessToken(User user, IList<string> roles)
    {
        ArgumentNullException.ThrowIfNull(user);
        ArgumentNullException.ThrowIfNull(roles);

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwt.Secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new(JwtRegisteredClaimNames.GivenName, user.FirstName),
            new(JwtRegisteredClaimNames.FamilyName, user.LastName),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };

        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var token = new JwtSecurityToken(
            issuer: _jwt.Issuer,
            audience: _jwt.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_jwt.ExpiryMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public async Task<string> CreateRefreshTokenAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var tokenValue = GenerateSecureToken();

        var refreshToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Token = tokenValue,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(_jwt.RefreshExpiryDays),
        };

        await refreshTokenStore.SaveAsync(refreshToken, cancellationToken);

        return tokenValue;
    }

    public async Task<string> RotateRefreshTokenAsync(User user, string oldToken, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(user);
        ArgumentNullException.ThrowIfNull(oldToken);

        var existing = await refreshTokenStore.GetByTokenAsync(oldToken, cancellationToken) ?? throw new InvalidOperationException("Refresh token not found.");

        if (existing.UserId != user.Id)
        {
            throw new InvalidOperationException("Refresh token does not belong to this user.");
        }

        if (existing.RevokedAt is not null)
        {
            throw new InvalidOperationException("Refresh token has already been revoked.");
        }

        if (existing.ExpiresAt <= DateTime.UtcNow)
        {
            throw new InvalidOperationException("Refresh token has expired.");
        }

        await refreshTokenStore.RevokeAsync(existing, cancellationToken);

        return await CreateRefreshTokenAsync(user.Id, cancellationToken);
    }

    private static string GenerateSecureToken()
    {
        var bytes = new byte[64];
        RandomNumberGenerator.Fill(bytes);
        return Convert.ToBase64String(bytes);
    }
}
