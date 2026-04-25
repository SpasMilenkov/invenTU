using InvenTU.Core.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace InvenTU.Infrastructure.DataSeeders;

/// <summary>
/// Seeds development users from <c>Seeding:Users</c> in configuration.
/// Each entry may specify a fixed <c>Id</c> (GUID) so that other seeders
/// (e.g. <see cref="DevDataSeeder"/>) can reference users by their known
/// <see cref="SeedIds"/> values without a database lookup.
/// </summary>
public static class DevUserSeeder
{
    public static async Task SeedAsync(IServiceProvider services, IConfiguration configuration)
    {
        await using var scope = services.CreateAsyncScope();

        var logger = scope.ServiceProvider
            .GetRequiredService<ILoggerFactory>()
            .CreateLogger(nameof(DevUserSeeder));

        var entries = configuration
            .GetSection("Seeding:Users")
            .Get<List<SeedUserEntry>>();

        if (entries is null || entries.Count == 0)
        {
            logger.LogInformation(
                "No users configured under Seeding:Users; skipping.");
            return;
        }

        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();

        foreach (var entry in entries)
        {
            if (!entry.IsValid())
            {
                logger.LogWarning(
                    "Skipping seed entry with missing Email, Password, or Role.");
                continue;
            }

            if (await userManager.FindByEmailAsync(entry.Email) is not null)
            {
                logger.LogInformation(
                    "User {Email} already exists, skipping.", entry.Email);
                continue;
            }

            if (!await roleManager.RoleExistsAsync(entry.Role))
            {
                logger.LogWarning(
                    "Role '{Role}' does not exist for user {Email}; skipping.",
                    entry.Role, entry.Email);
                continue;
            }

            var user = new User
            {
                // Use the fixed Id from config when provided so that other
                // seeders can reference this user via SeedIds without a DB lookup.
                // Falls back to a new GUID if not specified.
                Id = entry.Id ?? Guid.NewGuid(),
                FirstName = entry.FirstName,
                LastName = entry.LastName,
                Email = entry.Email,
                UserName = entry.Email,
                EmailConfirmed = true,
                IsActive = true,
            };

            var createResult = await userManager.CreateAsync(user, entry.Password);
            if (!createResult.Succeeded)
            {
                logger.LogError(
                    "Failed to create user {Email}: {Errors}",
                    entry.Email,
                    string.Join(", ", createResult.Errors.Select(e => e.Description)));
                continue;
            }

            var roleResult = await userManager.AddToRoleAsync(user, entry.Role);
            if (!roleResult.Succeeded)
            {
                logger.LogError(
                    "Failed to assign role '{Role}' to {Email}: {Errors}. Rolling back user creation.",
                    entry.Role, entry.Email,
                    string.Join(", ", roleResult.Errors.Select(e => e.Description)));
                await userManager.DeleteAsync(user);
                continue;
            }

            logger.LogInformation(
                "Seeded user {Email} (Id: {Id}) with role '{Role}'.",
                entry.Email, user.Id, entry.Role);
        }
    }

    private sealed class SeedUserEntry
    {
        public Guid? Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;

        public bool IsValid() =>
            !string.IsNullOrWhiteSpace(Email) &&
            !string.IsNullOrWhiteSpace(Password) &&
            !string.IsNullOrWhiteSpace(Role);
    }
}
