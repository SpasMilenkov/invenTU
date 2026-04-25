using InvenTU.Core.Entities;
using InvenTU.Core.Enums;
using InvenTU.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InvenTU.Infrastructure.DataSeeders;

internal static class AlertSeeder
{
    private static readonly DateTime SeedDate =
        new(2025, 1, 15, 9, 30, 0, DateTimeKind.Utc);

    private static readonly IReadOnlyList<Alert> Seed =
    [
        // Matches StockItemLaptop2 (Quantity=2, MinStockLevel=3)
        new Alert
        {
            Id               = SeedIds.AlertLaptop2LowStock,
            ProductId        = SeedIds.ProductLaptop2,
            WarehouseId      = SeedIds.WarehouseNorth,
            StockLocationId  = SeedIds.LocationNorthB1S1,
            AlertType        = AlertType.LowStock,
            CurrentQuantity  = 2,
            MinStockLevel    = 3,
            ReorderSuggestion = 8,
            Message          = "LPT-002 stock (2 units) has fallen below the minimum level of 3.",
            CreatedAt        = SeedDate,
            ResolvedAt       = null,
        },
        // Matches StockItemPaper1 (Quantity=75, ReorderPoint=100 used as effective minimum for alert)
        new Alert
        {
            Id               = SeedIds.AlertPaper1LowStock,
            ProductId        = SeedIds.ProductPaper1,
            WarehouseId      = SeedIds.WarehouseNorth,
            StockLocationId  = SeedIds.LocationNorthB1S1,
            AlertType        = AlertType.LowStock,
            CurrentQuantity  = 75,
            MinStockLevel    = 50,
            ReorderSuggestion = 200,
            Message          = "OFF-001 stock (75 reams) is approaching the reorder point of 100.",
            CreatedAt        = SeedDate,
            ResolvedAt       = null,
        },
    ];

    internal static void Seed_(InvenTUDbContext context)
    {
        var existingIds = context.Alerts
            .Select(a => a.Id)
            .ToHashSet();

        var toAdd = Seed.Where(a => !existingIds.Contains(a.Id)).ToList();
        if (toAdd.Count == 0) return;

        context.Alerts.AddRange(toAdd);
        context.SaveChanges();
    }

    internal static async Task SeedAsync(InvenTUDbContext context, CancellationToken ct)
    {
        var existingIds = await context.Alerts
            .Select(a => a.Id)
            .ToHashSetAsync(ct);

        var toAdd = Seed.Where(a => !existingIds.Contains(a.Id)).ToList();
        if (toAdd.Count == 0) return;

        context.Alerts.AddRange(toAdd);
        await context.SaveChangesAsync(ct);
    }
}
