using InvenTU.Core.Entities;
using InvenTU.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InvenTU.Infrastructure.DataSeeders;

internal static class StockItemSeeder
{
    // NOTE: RowVersion is managed by the database (PostgreSQL bytea).
    // EF Core will ignore the value on insert when the column is configured
    // as IsRowVersion() — the DB assigns it automatically.
    private static readonly IReadOnlyList<StockItem> Seed =
    [
        // PHN-001: healthy stock (above ReorderPoint=30)
        new StockItem
        {
            Id              = SeedIds.StockItemPhone1,
            ProductId       = SeedIds.ProductPhone1,
            StockLocationId = SeedIds.LocationMainA1S1,
            Quantity        = 85,
            QuantityReserved = 0,
        },
        // PHN-002: healthy stock (above ReorderPoint=15)
        new StockItem
        {
            Id              = SeedIds.StockItemPhone2,
            ProductId       = SeedIds.ProductPhone2,
            StockLocationId = SeedIds.LocationMainA1S2,
            Quantity        = 40,
            QuantityReserved = 0,
        },
        // LPT-001: healthy stock (above ReorderPoint=10)
        new StockItem
        {
            Id              = SeedIds.StockItemLaptop1,
            ProductId       = SeedIds.ProductLaptop1,
            StockLocationId = SeedIds.LocationMainA1S1,
            Quantity        = 22,
            QuantityReserved = 5,
        },
        // LPT-002: LOW STOCK — below MinStockLevel=3 → pairs with AlertLaptop2LowStock
        new StockItem
        {
            Id              = SeedIds.StockItemLaptop2,
            ProductId       = SeedIds.ProductLaptop2,
            StockLocationId = SeedIds.LocationNorthB1S1,
            Quantity        = 2,
            QuantityReserved = 0,
        },
        // OFF-001: NEAR REORDER POINT — below ReorderPoint=100 → pairs with AlertPaper1LowStock
        new StockItem
        {
            Id              = SeedIds.StockItemPaper1,
            ProductId       = SeedIds.ProductPaper1,
            StockLocationId = SeedIds.LocationNorthB1S1,
            Quantity        = 75,
            QuantityReserved = 0,
        },
        // OFF-002: healthy stock
        new StockItem
        {
            Id              = SeedIds.StockItemFile1,
            ProductId       = SeedIds.ProductFile1,
            StockLocationId = SeedIds.LocationNorthB1S2,
            Quantity        = 180,
            QuantityReserved = 0,
        },
    ];

    internal static void Seed_(InvenTUDbContext context)
    {
        var existingIds = context.StockItems
            .Select(si => si.Id)
            .ToHashSet();

        var toAdd = Seed.Where(si => !existingIds.Contains(si.Id)).ToList();
        if (toAdd.Count == 0) return;

        context.StockItems.AddRange(toAdd);
        context.SaveChanges();
    }

    internal static async Task SeedAsync(InvenTUDbContext context, CancellationToken ct)
    {
        var existingIds = await context.StockItems
            .Select(si => si.Id)
            .ToHashSetAsync(ct);

        var toAdd = Seed.Where(si => !existingIds.Contains(si.Id)).ToList();
        if (toAdd.Count == 0) return;

        context.StockItems.AddRange(toAdd);
        await context.SaveChangesAsync(ct);
    }
}
