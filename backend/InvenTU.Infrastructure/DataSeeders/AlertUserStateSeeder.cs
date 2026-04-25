using InvenTU.Core.Entities;
using InvenTU.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InvenTU.Infrastructure.DataSeeders;

/// <summary>
/// Seeds <see cref="AlertUserState"/> records so that:
///  - Admin user has read both alerts.
///  - Staff user has not read either alert (IsRead = false).
/// Requires both dev users and alerts to already exist.
/// Called from <see cref="DevDataSeeder"/> — not from <see cref="SeedOrchestrator"/>.
/// </summary>
internal static class AlertUserStateSeeder
{
    private static readonly IReadOnlyList<AlertUserState> Seed =
    [
        // Admin — both alerts read
        new AlertUserState
        {
            AlertId      = SeedIds.AlertLaptop2LowStock,
            UserId       = SeedIds.DevAdminUserId,
            IsRead       = true,
            SnoozedUntil = null,
        },
        new AlertUserState
        {
            AlertId      = SeedIds.AlertPaper1LowStock,
            UserId       = SeedIds.DevAdminUserId,
            IsRead       = true,
            SnoozedUntil = null,
        },

        // Staff — both alerts unread (inbox scenario for testing)
        new AlertUserState
        {
            AlertId      = SeedIds.AlertLaptop2LowStock,
            UserId       = SeedIds.DevStaffUserId,
            IsRead       = false,
            SnoozedUntil = null,
        },
        new AlertUserState
        {
            AlertId      = SeedIds.AlertPaper1LowStock,
            UserId       = SeedIds.DevStaffUserId,
            IsRead       = false,
            SnoozedUntil = null,
        },
    ];

    internal static async Task SeedAsync(InvenTUDbContext context, CancellationToken ct)
    {
        // Composite PK — check both keys together.
        var existingKeys = await context.AlertUserStates
            .Select(aus => new { aus.AlertId, aus.UserId })
            .ToHashSetAsync(ct);

        var toAdd = Seed
            .Where(aus => !existingKeys.Contains(new { aus.AlertId, aus.UserId }))
            .ToList();

        if (toAdd.Count == 0) return;

        context.AlertUserStates.AddRange(toAdd);
        await context.SaveChangesAsync(ct);
    }
}
