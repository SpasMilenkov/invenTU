using InvenTU.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace InvenTU.Infrastructure.DataSeeders;

/// <summary>
/// Seeds data that depends on Identity users existing.
/// Must be called <b>after</b> <c>IdentityRoleSeeder</c> and <c>DevUserSeeder</c>
/// in the development startup block in <c>Program.cs</c>.
///
/// <para>
/// Covers:
/// <list type="bullet">
///   <item><see cref="StockMovementSeeder"/> — initial receipts (needs UserId)</item>
///   <item><see cref="PurchaseOrderSeeder"/> — orders + lines (needs CreatedByUserId)</item>
///   <item><see cref="AlertUserStateSeeder"/> — read/unread states (needs UserId)</item>
/// </list>
/// </para>
/// </summary>
public static class DevDataSeeder
{
    public static async Task SeedAsync(IServiceProvider services, CancellationToken ct = default)
    {
        await using var scope = services.CreateAsyncScope();
        var context = scope.ServiceProvider.GetRequiredService<InvenTUDbContext>();

        // Guard: only proceed if the admin user that seed data references actually exists.
        // This prevents FK violations if DevUserSeeder was skipped or failed.
        var adminExists = await context.Users
            .AnyAsync(u => u.Id == SeedIds.DevAdminUserId, ct);

        if (!adminExists)
        {
            // Log a warning rather than throwing — non-fatal for startup.
            Console.Error.WriteLine(
                $"[DevDataSeeder] Skipped: dev admin user ({SeedIds.DevAdminUserId}) " +
                "not found. Run DevUserSeeder first.");
            return;
        }

        await StockMovementSeeder.SeedAsync(context, ct);
        await PurchaseOrderSeeder.SeedAsync(context, ct);
        await AlertUserStateSeeder.SeedAsync(context, ct);
    }
}
