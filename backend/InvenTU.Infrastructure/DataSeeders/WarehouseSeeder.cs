using InvenTU.Core.Entities;
using InvenTU.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InvenTU.Infrastructure.DataSeeders;

internal static class WarehouseSeeder
{
    private static readonly IReadOnlyList<Warehouse> Seed =
    [
        new Warehouse
        {
            Id            = SeedIds.WarehouseMain,
            Code          = "MAIN",
            Name          = "Main Warehouse",
            IsActive      = true,
            Location      = "123 Industrial Park, Sofia",
            MaxStockLevel = 10_000,
        },
        new Warehouse
        {
            Id            = SeedIds.WarehouseNorth,
            Code          = "NORTH",
            Name          = "North Warehouse",
            IsActive      = true,
            Location      = "7 Logistics Road, Varna",
            MaxStockLevel = 5_000,
        },
    ];

    internal static void Seed_(InvenTUDbContext context)
    {
        var existingCodes = context.Warehouses
            .Select(w => w.Code)
            .ToHashSet();

        var toAdd = Seed.Where(w => !existingCodes.Contains(w.Code)).ToList();
        if (toAdd.Count == 0) return;

        context.Warehouses.AddRange(toAdd);
        context.SaveChanges();
    }

    internal static async Task SeedAsync(InvenTUDbContext context, CancellationToken ct)
    {
        var existingCodes = await context.Warehouses
            .Select(w => w.Code)
            .ToHashSetAsync(ct);

        var toAdd = Seed.Where(w => !existingCodes.Contains(w.Code)).ToList();
        if (toAdd.Count == 0) return;

        context.Warehouses.AddRange(toAdd);
        await context.SaveChangesAsync(ct);
    }
}
