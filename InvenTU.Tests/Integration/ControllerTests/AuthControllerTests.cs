using System.Net;
using System.Net.Http.Json;
using InvenTU.Core.DTOs.Auth;
using InvenTU.Core.Entities;
using InvenTU.Infrastructure.Data;
using InvenTU.Infrastructure.DataSeeders;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace InvenTU.Tests.Integration.ControllerTests;

[Collection("Database")]
public sealed class AuthControllerTests(InvenTURealAuthFactory factory)
    : IntegrationTestBase<InvenTURealAuthFactory>(factory)
{
    private const string AdminEmail = "admin@inventu.dev";
    private const string AdminPassword = "DevAdmin123";

    private HttpClient NewClient() => Factory.CreateClient(new WebApplicationFactoryClientOptions
    {
        HandleCookies = true,
        BaseAddress = new Uri("https://localhost"),
        AllowAutoRedirect = false,
    });

    [Fact]
    public async Task Register_NewUser_Returns201()
    {
        using var client = NewClient();
        var dto = new RegisterDTO
        {
            FirstName = "Jane",
            LastName = "Doe",
            Email = $"jane{Guid.NewGuid():N}@test.local",
            Password = "TestPass123!",
            ConfirmPassword = "TestPass123!",
        };
        var resp = await client.PostAsJsonAsync("/api/v1/auth/register", dto, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Created, resp.StatusCode);
    }

    [Fact]
    public async Task Register_DuplicateEmail_Returns409()
    {
        using var client = NewClient();
        var dto = new RegisterDTO
        {
            FirstName = "Test",
            LastName = "User",
            Email = AdminEmail,
            Password = "AnotherPass123!",
            ConfirmPassword = "AnotherPass123!",
        };
        var resp = await client.PostAsJsonAsync("/api/v1/auth/register", dto, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Conflict, resp.StatusCode);
    }

    [Fact]
    public async Task Register_PasswordMismatch_Returns400()
    {
        using var client = NewClient();
        var dto = new RegisterDTO
        {
            FirstName = "Mis",
            LastName = "Match",
            Email = $"mismatch{Guid.NewGuid():N}@test.local",
            Password = "Pass1234!",
            ConfirmPassword = "DifferentPass!",
        };
        var resp = await client.PostAsJsonAsync("/api/v1/auth/register", dto, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
    }

    [Fact]
    public async Task Login_ValidCredentials_Returns200WithCookies()
    {
        using var client = NewClient();
        var resp = await client.PostAsJsonAsync("/api/v1/auth/login", new LoginDTO { Email = AdminEmail, Password = AdminPassword }, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        Assert.True(resp.Headers.TryGetValues("Set-Cookie", out var cookies));
        var joined = string.Join(';', cookies!);
        Assert.Contains("AccessToken=", joined);
        Assert.Contains("RefreshToken=", joined);
    }

    [Fact]
    public async Task Login_WrongPassword_Returns401()
    {
        using var client = NewClient();
        var resp = await client.PostAsJsonAsync("/api/v1/auth/login", new LoginDTO { Email = AdminEmail, Password = "totally-wrong" }, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Unauthorized, resp.StatusCode);
    }

    [Fact]
    public async Task Login_UnknownEmail_Returns401()
    {
        using var client = NewClient();
        var resp = await client.PostAsJsonAsync("/api/v1/auth/login", new LoginDTO { Email = "nobody@nowhere.test", Password = "anything" }, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Unauthorized, resp.StatusCode);
    }

    [Fact]
    public async Task Refresh_ValidCookie_RotatesTokens()
    {
        using var client = await Factory.LoginAsAsync(AdminEmail, AdminPassword);

        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<InvenTUDbContext>();
        var beforeActive = await db.Set<RefreshToken>().Where(t => t.RevokedAt == null).CountAsync(TestContext.Current.CancellationToken);

        var resp = await client.PostAsync("/api/v1/auth/refresh", content: null, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);

        var afterActive = await db.Set<RefreshToken>().Where(t => t.RevokedAt == null).CountAsync(TestContext.Current.CancellationToken);
        var afterRevoked = await db.Set<RefreshToken>().Where(t => t.RevokedAt != null).CountAsync(TestContext.Current.CancellationToken);
        Assert.Equal(beforeActive, afterActive);
        Assert.Equal(1, afterRevoked);
    }

    [Fact]
    public async Task Refresh_MissingCookie_Returns401()
    {
        using var client = NewClient();
        var resp = await client.PostAsync("/api/v1/auth/refresh", content: null, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Unauthorized, resp.StatusCode);
    }

    [Fact]
    public async Task Logout_ClearsCookiesAndRevokesRefresh()
    {
        using var client = await Factory.LoginAsAsync(AdminEmail, AdminPassword);

        var resp = await client.PostAsync("/api/v1/auth/logout", content: null, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NoContent, resp.StatusCode);

        Assert.True(resp.Headers.TryGetValues("Set-Cookie", out var cookies));
        var joined = string.Join(';', cookies!);
        // Empty value (AccessToken=;) confirms the cookie was cleared rather than reissued.
        Assert.Contains("AccessToken=;", joined);
        Assert.Contains("RefreshToken=;", joined);

        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<InvenTUDbContext>();
        var anyActive = await db.Set<RefreshToken>()
            .AnyAsync(t => t.RevokedAt == null && t.UserId == SeedIds.DevAdminUserId, TestContext.Current.CancellationToken);
        Assert.False(anyActive);
    }

    [Fact]
    public async Task Current_AfterLogin_ReturnsUser()
    {
        using var client = await Factory.LoginAsAsync(AdminEmail, AdminPassword);
        var resp = await client.GetAsync("/api/v1/auth/current", TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);

        var body = await resp.Content.ReadFromJsonAsync<CurrentUserDTO>(TestContext.Current.CancellationToken);
        Assert.NotNull(body);
        Assert.Equal(AdminEmail, body.Email);
        Assert.NotNull(body.Roles);
        Assert.Contains(Roles.Admin, body.Roles);
    }

    [Fact]
    public async Task Current_Anonymous_Returns401()
    {
        using var client = NewClient();
        var resp = await client.GetAsync("/api/v1/auth/current", TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Unauthorized, resp.StatusCode);
    }
}
