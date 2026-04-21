using InvenTU.Core.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace InvenTU.Infrastructure.DataSeeders;

public static class DevUserSeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider, IConfiguration configuration)
    {
        var logger = serviceProvider
            .GetRequiredService<ILoggerFactory>()
            .CreateLogger(nameof(DevUserSeeder));

        var entries = configuration.GetSection("Seeding:Users").Get<List<SeedUserConfig>>();
        if (entries is null || entries.Count == 0)
        {
            logger.LogInformation("No seeded users configured under Seeding:Users; skipping.");
            return;
        }

        var userManager = serviceProvider.GetRequiredService<UserManager<User>>();
        var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();

        foreach (var entry in entries)
        {
            if (string.IsNullOrWhiteSpace(entry.Email) || string.IsNullOrWhiteSpace(entry.Password))
            {
                logger.LogWarning("Skipping seed entry with missing Email or Password.");
                continue;
            }

            if (await userManager.FindByEmailAsync(entry.Email) is not null)
            {
                logger.LogInformation("User {Email} already exists, skipping.", entry.Email);
                continue;
            }

            if (!await roleManager.RoleExistsAsync(entry.Role))
            {
                logger.LogWarning(
                    "Role {Role} does not exist for seed entry {Email}; skipping.",
                    entry.Role,
                    entry.Email);
                continue;
            }

            var user = new User
            {
                FirstName = entry.FirstName,
                LastName = entry.LastName,
                Email = entry.Email,
                UserName = entry.FirstName + entry.LastName,
                EmailConfirmed = true,
                IsActive = true,
            };

            var createResult = await userManager.CreateAsync(user, entry.Password);
            if (!createResult.Succeeded)
            {
                logger.LogError(
                    "Failed to create seeded user {Email}: {Errors}",
                    entry.Email,
                    string.Join(", ", createResult.Errors.Select(e => e.Description)));
                continue;
            }

            var roleResult = await userManager.AddToRoleAsync(user, entry.Role);
            if (!roleResult.Succeeded)
            {
                logger.LogError(
                    "Failed to assign role {Role} to seeded user {Email}: {Errors}. Rolling back.",
                    entry.Role,
                    entry.Email,
                    string.Join(", ", roleResult.Errors.Select(e => e.Description)));
                await userManager.DeleteAsync(user);
                continue;
            }

            logger.LogInformation("Seeded {Email} with role {Role}.", entry.Email, entry.Role);
        }
    }

    private sealed class SeedUserConfig
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }
}
