using System;
using System.Collections.Generic;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace InvenTU.Infrastructure.DataSeeders;

public static class IdentityRoleSeeder
{
    // Define application roles to seed
    private static string[] _roleNames = { "Admin", "Manager", "Worker" };
    public async static Task SeedRolesAsync(IServiceProvider serviceProvider)
    {
        var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();

        // Seed missing roles
        foreach (var roleName in _roleNames)
            if (!await roleManager.RoleExistsAsync(roleName))
                await roleManager.CreateAsync(new IdentityRole<Guid>(roleName));
    }
}
