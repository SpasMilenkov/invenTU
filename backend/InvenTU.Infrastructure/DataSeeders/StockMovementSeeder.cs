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
    // Relative to "now" so freshly-seeded dev databases always sit inside the
    // default report windows (Stock Movement = 30 days, Turnover = 90 days).
    // Receipts are dated 21 days ago; issues are layered on top a few days later.
    private static readonly DateTime ReceiptDate =
        DateTime.SpecifyKind(DateTime.UtcNow.Date.AddDays(-21), DateTimeKind.Utc);

    private static readonly DateTime IssueDate =
        DateTime.SpecifyKind(DateTime.UtcNow.Date.AddDays(-7), DateTimeKind.Utc);

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
            CreatedAt            = ReceiptDate,
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
            CreatedAt            = ReceiptDate,
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
            CreatedAt            = ReceiptDate,
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
            CreatedAt            = ReceiptDate,
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
            CreatedAt            = ReceiptDate,
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
            CreatedAt            = ReceiptDate,
        },

        // Issue movements (a few weeks after the receipts) so the Turnover
        // report produces a mix of FastMoving / Normal / SlowMoving classes.
        // Phone1 receives heavy issue volume so its annualised ratio crosses
        // the FastMoving threshold; Phone2/Laptop1/Paper1 land in Normal;
        // Laptop2 and File1 receive no issues and stay SlowMoving.
        new StockMovement
        {
            Id                   = SeedIds.MovementPhone1Issue1,
            ProductId            = SeedIds.ProductPhone1,
            SourceWarehouseId    = SeedIds.WarehouseMain,
            DestinationWarehouseId = null,
            StockLocationId      = SeedIds.LocationMainA1S1,
            MovementType         = MovementType.Issue,
            Quantity             = 100,
            Status               = MovementStatus.Approved,
            ReasonCode           = "SALE",
            ReferenceNumber      = "ISS-PHN-001",
            Notes                = "Sample issue for turnover seeding",
            UserId               = SeedIds.DevAdminUserId,
            CreatedAt            = IssueDate,
        },
        new StockMovement
        {
            Id                   = SeedIds.MovementPhone1Issue2,
            ProductId            = SeedIds.ProductPhone1,
            SourceWarehouseId    = SeedIds.WarehouseMain,
            DestinationWarehouseId = null,
            StockLocationId      = SeedIds.LocationMainA1S1,
            MovementType         = MovementType.Issue,
            Quantity             = 200,
            Status               = MovementStatus.Approved,
            ReasonCode           = "SALE",
            ReferenceNumber      = "ISS-PHN-002",
            Notes                = "Sample issue for turnover seeding",
            UserId               = SeedIds.DevAdminUserId,
            CreatedAt            = IssueDate.AddDays(3),
        },
        new StockMovement
        {
            Id                   = SeedIds.MovementPhone2Issue1,
            ProductId            = SeedIds.ProductPhone2,
            SourceWarehouseId    = SeedIds.WarehouseMain,
            DestinationWarehouseId = null,
            StockLocationId      = SeedIds.LocationMainA1S2,
            MovementType         = MovementType.Issue,
            Quantity             = 15,
            Status               = MovementStatus.Approved,
            ReasonCode           = "SALE",
            ReferenceNumber      = "ISS-PHN-003",
            Notes                = "Sample issue for turnover seeding",
            UserId               = SeedIds.DevAdminUserId,
            CreatedAt            = IssueDate.AddDays(1),
        },
        new StockMovement
        {
            Id                   = SeedIds.MovementLaptop1Issue,
            ProductId            = SeedIds.ProductLaptop1,
            SourceWarehouseId    = SeedIds.WarehouseMain,
            DestinationWarehouseId = null,
            StockLocationId      = SeedIds.LocationMainA1S1,
            MovementType         = MovementType.Issue,
            Quantity             = 8,
            Status               = MovementStatus.Approved,
            ReasonCode           = "SALE",
            ReferenceNumber      = "ISS-LPT-001",
            Notes                = "Sample issue for turnover seeding",
            UserId               = SeedIds.DevAdminUserId,
            CreatedAt            = IssueDate.AddDays(2),
        },
        new StockMovement
        {
            Id                   = SeedIds.MovementPaper1Issue,
            ProductId            = SeedIds.ProductPaper1,
            SourceWarehouseId    = SeedIds.WarehouseNorth,
            DestinationWarehouseId = null,
            StockLocationId      = SeedIds.LocationNorthB1S1,
            MovementType         = MovementType.Issue,
            Quantity             = 25,
            Status               = MovementStatus.Approved,
            ReasonCode           = "SALE",
            ReferenceNumber      = "ISS-OFF-001",
            Notes                = "Sample issue for turnover seeding",
            UserId               = SeedIds.DevAdminUserId,
            CreatedAt            = IssueDate.AddDays(4),
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
