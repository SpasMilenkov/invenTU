using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace InvenTU.Infrastructure.DataSeeders;

public static class IdentityRoleSeeder
{
    private static readonly IReadOnlyList<string> Roles =
    [
        "Admin",
        "Manager",
        "Worker",
    ];

    public static async Task SeedRolesAsync(IServiceProvider services)
    {
        await using var scope = services.CreateAsyncScope();

        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
        var logger = scope.ServiceProvider
            .GetRequiredService<ILoggerFactory>()
            .CreateLogger(nameof(IdentityRoleSeeder));

        foreach (var roleName in Roles)
        {
            if (await roleManager.RoleExistsAsync(roleName))
                continue;

            var result = await roleManager.CreateAsync(new IdentityRole<Guid>(roleName));

            if (result.Succeeded)
                logger.LogInformation("Created role '{Role}'.", roleName);
            else
                logger.LogError(
                    "Failed to create role '{Role}': {Errors}",
                    roleName,
                    string.Join(", ", result.Errors.Select(e => e.Description)));
        }
    }
}
