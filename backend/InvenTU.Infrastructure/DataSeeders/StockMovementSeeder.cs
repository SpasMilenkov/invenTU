using InvenTU.Core.Entities;
using InvenTU.Core.Enums;
using InvenTU.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InvenTU.Infrastructure.DataSeeders;

/// <summary>
/// Seeds initial receipt <see cref="StockMovement"/> records.
/// Requires <see cref="SeedIds.DevAdminUserId"/> to exist (created by DevUserSeeder).
/// Called from <see cref="DevDataSeeder"/> — not from <see cref="SeedOrchestrator"/>.
/// </summary>
internal static class StockMovementSeeder
{
    private static readonly DateTime SeedDate =
        new(2025, 1, 15, 9, 0, 0, DateTimeKind.Utc);

    // SourceWarehouseId is null for initial receipts (goods arriving from outside).
    private static IReadOnlyList<StockMovement> BuildSeed() =>
    [
        new StockMovement
        {
            Id                   = SeedIds.MovementPhone1Init,
            ProductId            = SeedIds.ProductPhone1,
            SourceWarehouseId    = null,
            DestinationWarehouseId = SeedIds.WarehouseMain,
            StockLocationId      = SeedIds.LocationMainA1S1,
            MovementType         = MovementType.Receipt,
            Quantity             = 85,
            Status               = MovementStatus.Approved,
            ReasonCode           = "INITIAL_STOCK",
            ReferenceNumber      = "INIT-PHN-001",
            Notes                = "Initial stock receipt",
            UserId               = SeedIds.DevAdminUserId,
            CreatedAt            = SeedDate,
        },
        new StockMovement
        {
            Id                   = SeedIds.MovementPhone2Init,
            ProductId            = SeedIds.ProductPhone2,
            SourceWarehouseId    = null,
            DestinationWarehouseId = SeedIds.WarehouseMain,
            StockLocationId      = SeedIds.LocationMainA1S2,
            MovementType         = MovementType.Receipt,
            Quantity             = 40,
            Status               = MovementStatus.Approved,
            ReasonCode           = "INITIAL_STOCK",
            ReferenceNumber      = "INIT-PHN-002",
            Notes                = "Initial stock receipt",
            UserId               = SeedIds.DevAdminUserId,
            CreatedAt            = SeedDate,
        },
        new StockMovement
        {
            Id                   = SeedIds.MovementLaptop1Init,
            ProductId            = SeedIds.ProductLaptop1,
            SourceWarehouseId    = null,
            DestinationWarehouseId = SeedIds.WarehouseMain,
            StockLocationId      = SeedIds.LocationMainA1S1,
            MovementType         = MovementType.Receipt,
            Quantity             = 22,
            Status               = MovementStatus.Approved,
            ReasonCode           = "INITIAL_STOCK",
            ReferenceNumber      = "INIT-LPT-001",
            Notes                = "Initial stock receipt",
            UserId               = SeedIds.DevAdminUserId,
            CreatedAt            = SeedDate,
        },
        new StockMovement
        {
            Id                   = SeedIds.MovementLaptop2Init,
            ProductId            = SeedIds.ProductLaptop2,
            SourceWarehouseId    = null,
            DestinationWarehouseId = SeedIds.WarehouseNorth,
            StockLocationId      = SeedIds.LocationNorthB1S1,
            MovementType         = MovementType.Receipt,
            Quantity             = 2,       // matches StockItem — low stock scenario
            Status               = MovementStatus.Approved,
            ReasonCode           = "INITIAL_STOCK",
            ReferenceNumber      = "INIT-LPT-002",
            Notes                = "Initial stock receipt — low quantity triggers alert",
            UserId               = SeedIds.DevAdminUserId,
            CreatedAt            = SeedDate,
        },
        new StockMovement
        {
            Id                   = SeedIds.MovementPaper1Init,
            ProductId            = SeedIds.ProductPaper1,
            SourceWarehouseId    = null,
            DestinationWarehouseId = SeedIds.WarehouseNorth,
            StockLocationId      = SeedIds.LocationNorthB1S1,
            MovementType         = MovementType.Receipt,
            Quantity             = 75,      // matches StockItem — near reorder point
            Status               = MovementStatus.Approved,
            ReasonCode           = "INITIAL_STOCK",
            ReferenceNumber      = "INIT-OFF-001",
            Notes                = "Initial stock receipt — quantity near reorder point",
            UserId               = SeedIds.DevAdminUserId,
            CreatedAt            = SeedDate,
        },
        new StockMovement
        {
            Id                   = SeedIds.MovementFile1Init,
            ProductId            = SeedIds.ProductFile1,
            SourceWarehouseId    = null,
            DestinationWarehouseId = SeedIds.WarehouseNorth,
            StockLocationId      = SeedIds.LocationNorthB1S2,
            MovementType         = MovementType.Receipt,
            Quantity             = 180,
            Status               = MovementStatus.Approved,
            ReasonCode           = "INITIAL_STOCK",
            ReferenceNumber      = "INIT-OFF-002",
            Notes                = "Initial stock receipt",
            UserId               = SeedIds.DevAdminUserId,
            CreatedAt            = SeedDate,
        },
    ];

    internal static async Task SeedAsync(InvenTUDbContext context, CancellationToken ct)
    {
        var existingIds = await context.StockMovements
            .Select(sm => sm.Id)
            .ToHashSetAsync(ct);

        var toAdd = BuildSeed()
            .Where(sm => !existingIds.Contains(sm.Id))
            .ToList();

        if (toAdd.Count == 0) return;

        context.StockMovements.AddRange(toAdd);
        await context.SaveChangesAsync(ct);
    }

}
