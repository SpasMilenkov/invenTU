using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using InvenTU.Core.DTOs.Auth;
using InvenTU.Infrastructure.DataSeeders;
using InvenTU.Tests.Integration.Auth;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;

namespace InvenTU.Tests.Integration;

public static class InvenTUApplicationFactoryExtensions
{
    /// <summary>
    /// Returns an HttpClient with NO claims stamped. The default
    /// authentication scheme returns NoResult, so any [Authorize] endpoint
    /// returns 401.
    /// </summary>
    public static HttpClient CreateAnonymousClient(this InvenTUApplicationFactory factory)
    {
        Console.WriteLine($"[ACCESS-ANON] {DateTime.UtcNow:HH:mm:ss.fff} factory={factory.GetType().Name} hash={factory.GetHashCode()}");
        AuthClaimProvider provider;
        try
        {
            provider = factory.Services.GetRequiredService<AuthClaimProvider>();
        }
        catch (ObjectDisposedException ex)
        {
            throw new InvalidOperationException(
                $"[CreateAnonymousClient] factory.Services was disposed. factory={factory.GetType().Name} hash={factory.GetHashCode()} inner={ex}", ex);
        }
        provider.Claims.Clear();
        return factory.CreateClient();
    }

    /// <summary>
    /// Returns an HttpClient authenticated as a principal with the given
    /// roles. NameIdentifier defaults to the seeded admin user's id so any
    /// controller that resolves the current user from the DB finds a real
    /// user record.
    /// </summary>
    /// <remarks>
    /// The underlying <see cref="AuthClaimProvider"/> is a singleton shared
    /// across the test class. The pattern is: <em>set claims → issue request →
    /// await response → set claims for next call</em>. Do not call
    /// <c>CreateClientAs</c> twice and then re-use the first <see cref="HttpClient"/>
    /// — the second call will have overwritten the shared claims.
    /// </remarks>
    public static HttpClient CreateClientAs(this InvenTUApplicationFactory factory, params string[] roles)
        => factory.CreateClientAs(SeedIds.DevAdminUserId, roles);

    /// <summary>
    /// Returns an HttpClient authenticated as the given user id with the
    /// given roles. Use this overload when the test needs a specific user
    /// (e.g. asserting that movement.UserId == thisUserId).
    /// </summary>
    /// <remarks>
    /// See <see cref="CreateClientAs(InvenTUApplicationFactory, string[])"/>
    /// for the mutate-then-call invariant.
    /// </remarks>
    public static HttpClient CreateClientAs(this InvenTUApplicationFactory factory, Guid userId, params string[] roles)
    {
        Console.WriteLine($"[ACCESS-AS] {DateTime.UtcNow:HH:mm:ss.fff} factory={factory.GetType().Name} hash={factory.GetHashCode()} userId={userId} roles=[{string.Join(",", roles)}]");
        AuthClaimProvider provider;
        try
        {
            provider = factory.Services.GetRequiredService<AuthClaimProvider>();
        }
        catch (ObjectDisposedException ex)
        {
            throw new InvalidOperationException(
                $"[CreateClientAs] factory.Services was disposed. factory={factory.GetType().Name} hash={factory.GetHashCode()} userId={userId} inner={ex}", ex);
        }
        provider.Claims.Clear();
        provider.Claims.Add(new Claim(ClaimTypes.NameIdentifier, userId.ToString()));
        foreach (var role in roles)
            provider.Claims.Add(new Claim(ClaimTypes.Role, role));
        return factory.CreateClient();
    }

    /// <summary>
    /// Login through the real Auth pipeline and return a cookie-bearing
    /// HttpClient. BaseAddress is https://localhost so the Secure cookies
    /// issued by AuthController are accepted by the in-memory cookie container.
    /// </summary>
    public static async Task<HttpClient> LoginAsAsync(this InvenTURealAuthFactory factory, string email, string password)
    {
        var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            HandleCookies = true,
            BaseAddress = new Uri("https://localhost"),
            AllowAutoRedirect = false,
        });

        var response = await client.PostAsJsonAsync("/api/v1/auth/login", new LoginDTO { Email = email, Password = password });
        if (response.StatusCode != HttpStatusCode.OK)
            throw new InvalidOperationException($"Test login failed for {email}: {response.StatusCode}");

        return client;
    }
}
