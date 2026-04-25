using InvenTU.Core.Entities;
using InvenTU.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InvenTU.Infrastructure.DataSeeders;

internal static class StockLocationSeeder
{
    private static readonly IReadOnlyList<StockLocation> Seed =
    [
        // Main Warehouse
        new StockLocation
        {
            Id          = SeedIds.LocationMainA1S1,
            WarehouseId = SeedIds.WarehouseMain,
            Zone        = "A",
            Aisle       = "1",
            Shelf       = "1",
            Bin         = "1",
            MaxCapacity = 500,
        },
        new StockLocation
        {
            Id          = SeedIds.LocationMainA1S2,
            WarehouseId = SeedIds.WarehouseMain,
            Zone        = "A",
            Aisle       = "1",
            Shelf       = "2",
            Bin         = "1",
            MaxCapacity = 500,
        },

        // North Warehouse
        new StockLocation
        {
            Id          = SeedIds.LocationNorthB1S1,
            WarehouseId = SeedIds.WarehouseNorth,
            Zone        = "B",
            Aisle       = "1",
            Shelf       = "1",
            Bin         = "1",
            MaxCapacity = 300,
        },
        new StockLocation
        {
            Id          = SeedIds.LocationNorthB1S2,
            WarehouseId = SeedIds.WarehouseNorth,
            Zone        = "B",
            Aisle       = "1",
            Shelf       = "2",
            Bin         = "1",
            MaxCapacity = 300,
        },
    ];

    internal static void Seed_(InvenTUDbContext context)
    {
        var existingIds = context.StockLocations
            .Select(l => l.Id)
            .ToHashSet();

        var toAdd = Seed.Where(l => !existingIds.Contains(l.Id)).ToList();
        if (toAdd.Count == 0) return;

        context.StockLocations.AddRange(toAdd);
        context.SaveChanges();
    }

    internal static async Task SeedAsync(InvenTUDbContext context, CancellationToken ct)
    {
        var existingIds = await context.StockLocations
            .Select(l => l.Id)
            .ToHashSetAsync(ct);

        var toAdd = Seed.Where(l => !existingIds.Contains(l.Id)).ToList();
        if (toAdd.Count == 0) return;

        context.StockLocations.AddRange(toAdd);
        await context.SaveChangesAsync(ct);
    }
}
