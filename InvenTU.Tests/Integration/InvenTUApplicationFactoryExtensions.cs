using System.Security.Claims;
using InvenTU.Tests.Integration.Auth;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;

namespace InvenTU.Tests.Integration;

public static class InvenTUApplicationFactoryExtensions
{
    public static HttpClient CreateClientWithClaims(this InvenTUApplicationFactory factory, AuthClaimProvider claimProvider)
    {
        var client = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureTestServices(services =>
            {
                services.AddScoped(_ => claimProvider);
            });
        }).CreateClient();

        return client;
    }
}
