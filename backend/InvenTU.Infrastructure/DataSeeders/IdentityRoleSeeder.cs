using System;
using System.Collections.Generic;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace InvenTU.Infrastructure.DataSeeders;

public class IdentityRoleSeeder : IHostedService
{
    // Define application roles to seed
    private static string[] _roleNames = { "Admin", "Manager", "Worker" };
    private IServiceProvider _serviceProvider;
    public IdentityRoleSeeder(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }
    public async Task SeedRolesAsync(IServiceScope scope)
    {
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();

        // Seed missing roles
        foreach (var roleName in _roleNames)
            if (!await roleManager.RoleExistsAsync(roleName))
                await roleManager.CreateAsync(new IdentityRole<Guid>(roleName));
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        using (var scope = _serviceProvider.CreateScope())
            await SeedRolesAsync(scope);

    }
    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
