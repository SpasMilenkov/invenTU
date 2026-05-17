using InvenTU.Tests.Integration.Auth;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.DependencyInjection;

namespace InvenTU.Tests.Integration;

public sealed class InvenTUApplicationFactory : TestApplicationFactoryBase
{
    protected override void ConfigureAuthentication(IServiceCollection services)
    {
        services.AddAuthorization(options =>
        {
            options.DefaultPolicy = new AuthorizationPolicyBuilder()
                .AddAuthenticationSchemes(TestAuthHandler.SchemeName)
                .Combine(options.DefaultPolicy)
                .Build();
        })
        .AddAuthentication()
        .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>(TestAuthHandler.SchemeName, _ => { });

        services.AddSingleton<AuthClaimProvider>();
    }
}
