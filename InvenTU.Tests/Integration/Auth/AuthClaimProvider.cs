using System.Security.Claims;

namespace InvenTU.Tests.Integration.Auth;

public sealed class AuthClaimProvider
{
    public IList<Claim> Claims { get; set; } = new List<Claim>();

    public static AuthClaimProvider WithRoles(params string[] roles)
    {
        var provider = new AuthClaimProvider();

        foreach (var role in roles)
            provider.Claims.Add(new Claim(ClaimTypes.Role, role));

        return provider;

    }
}
