// Suppress xUnit1051: Moq's It.IsAny<CancellationToken>() is the correct matcher
// for Setup lambdas, but the xunit analyzer cannot distinguish it from a real
// async call missing the test CT. Unit tests are CPU-bound and complete in
// milliseconds, so cancellation responsiveness is not a meaningful concern here.
#pragma warning disable xUnit1051

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using InvenTU.Core.Contracts.Repositories;
using InvenTU.Core.Entities;
using InvenTU.Infrastructure.Auth;
using InvenTU.Infrastructure.Settings;
using Microsoft.Extensions.Options;
using Moq;

namespace InvenTU.Tests.Unit;

public sealed class TokenServiceTests
{
    private static readonly JwtSettings Settings = new()
    {
        Secret = "unit-test-secret-key-minimum-32-chars-long!!",
        Issuer = "InvenTU",
        Audience = "InvenTU",
        ExpiryMinutes = 60,
        RefreshExpiryDays = 7,
    };

    private static TokenService Build(out Mock<IRefreshTokenStore> store)
    {
        store = new Mock<IRefreshTokenStore>();
        return new TokenService(Options.Create(Settings), store.Object);
    }

    private static User SampleUser() => new()
    {
        Id = Guid.NewGuid(),
        Email = "alice@test.local",
        UserName = "alice",
        FirstName = "Alice",
        LastName = "Doe",
    };

    [Fact]
    public void GenerateAccessToken_EmitsExpectedClaims()
    {
        var svc = Build(out _);
        var user = SampleUser();
        var token = svc.GenerateAccessToken(user, new[] { "Admin", "Manager" });

        var parsed = new JwtSecurityTokenHandler().ReadJwtToken(token);
        Assert.Equal("InvenTU", parsed.Issuer);
        Assert.Contains(parsed.Claims, c => c.Type == JwtRegisteredClaimNames.Sub && c.Value == user.Id.ToString());
        Assert.Contains(parsed.Claims, c => c.Type == JwtRegisteredClaimNames.Email && c.Value == user.Email);
        Assert.Contains(parsed.Claims, c => c.Type == ClaimTypes.Role && c.Value == "Admin");
        Assert.Contains(parsed.Claims, c => c.Type == ClaimTypes.Role && c.Value == "Manager");
    }

    [Fact]
    public void GenerateAccessToken_ExpiryMatchesSettings()
    {
        var svc = Build(out _);
        var token = svc.GenerateAccessToken(SampleUser(), Array.Empty<string>());
        var parsed = new JwtSecurityTokenHandler().ReadJwtToken(token);

        var ttl = parsed.ValidTo - DateTime.UtcNow;
        Assert.InRange(ttl.TotalMinutes, Settings.ExpiryMinutes - 1, Settings.ExpiryMinutes + 1);
    }

    [Fact]
    public async Task CreateRefreshTokenAsync_PersistsViaStore()
    {
        var svc = Build(out var store);
        var userId = Guid.NewGuid();

        var token = await svc.CreateRefreshTokenAsync(userId);
        Assert.False(string.IsNullOrEmpty(token));
        store.Verify(s => s.SaveAsync(
            It.Is<RefreshToken>(t => t.UserId == userId && t.Token == token),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task RotateRefreshTokenAsync_MismatchedUser_Throws()
    {
        var svc = Build(out var store);
        var user = SampleUser();
        store.Setup(s => s.GetByTokenAsync("old", It.IsAny<CancellationToken>()))
             .ReturnsAsync(new RefreshToken { UserId = Guid.NewGuid(), ExpiresAt = DateTime.UtcNow.AddDays(1) });

        await Assert.ThrowsAsync<InvalidOperationException>(() => svc.RotateRefreshTokenAsync(user, "old"));
    }

    [Fact]
    public async Task RotateRefreshTokenAsync_RevokedToken_Throws()
    {
        var svc = Build(out var store);
        var user = SampleUser();
        store.Setup(s => s.GetByTokenAsync("old", It.IsAny<CancellationToken>()))
             .ReturnsAsync(new RefreshToken { UserId = user.Id, RevokedAt = DateTime.UtcNow, ExpiresAt = DateTime.UtcNow.AddDays(1) });

        await Assert.ThrowsAsync<InvalidOperationException>(() => svc.RotateRefreshTokenAsync(user, "old"));
    }

    [Fact]
    public async Task RotateRefreshTokenAsync_ExpiredToken_Throws()
    {
        var svc = Build(out var store);
        var user = SampleUser();
        store.Setup(s => s.GetByTokenAsync("old", It.IsAny<CancellationToken>()))
             .ReturnsAsync(new RefreshToken { UserId = user.Id, ExpiresAt = DateTime.UtcNow.AddDays(-1) });

        await Assert.ThrowsAsync<InvalidOperationException>(() => svc.RotateRefreshTokenAsync(user, "old"));
    }

    [Fact]
    public async Task RotateRefreshTokenAsync_Success_RevokesOldAndCreatesNew()
    {
        var svc = Build(out var store);
        var user = SampleUser();
        var existing = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = "old",
            ExpiresAt = DateTime.UtcNow.AddDays(1),
        };
        store.Setup(s => s.GetByTokenAsync("old", It.IsAny<CancellationToken>())).ReturnsAsync(existing);

        var newToken = await svc.RotateRefreshTokenAsync(user, "old");
        Assert.False(string.IsNullOrEmpty(newToken));
        Assert.NotEqual("old", newToken);

        store.Verify(s => s.RevokeAsync(existing, It.IsAny<CancellationToken>()), Times.Once);
        store.Verify(s => s.SaveAsync(
            It.Is<RefreshToken>(t => t.UserId == user.Id && t.Token == newToken),
            It.IsAny<CancellationToken>()), Times.Once);
    }
}
