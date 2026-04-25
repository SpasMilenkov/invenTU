using InvenTU.Core.Entities;
using InvenTU.Core.Enums;
using InvenTU.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InvenTU.Infrastructure.DataSeeders;

/// <summary>
/// Seeds two <see cref="PurchaseOrder"/> records with their lines.
/// Requires <see cref="SeedIds.DevAdminUserId"/> to exist (created by DevUserSeeder).
/// Called from <see cref="DevDataSeeder"/> — not from <see cref="SeedOrchestrator"/>.
/// </summary>
internal static class PurchaseOrderSeeder
{
    private static readonly DateTime OrderDate =
        new(2025, 1, 10, 8, 0, 0, DateTimeKind.Utc);

    private static readonly DateTime ExpectedDateReceived =
        new(2025, 1, 17, 8, 0, 0, DateTimeKind.Utc);

    private static readonly DateTime OrderDatePending =
        new(2025, 1, 20, 8, 0, 0, DateTimeKind.Utc);

    private static readonly DateTime ExpectedDatePending =
        new(2025, 1, 27, 8, 0, 0, DateTimeKind.Utc);

    internal static async Task SeedAsync(InvenTUDbContext context, CancellationToken ct)
    {
        await SeedOrderAsync(
            context,
            SeedIds.PurchaseOrderTech,
            SeedIds.SupplierTechDistrib,
            PurchaseOrderStatus.Received,
            OrderDate,
            ExpectedDateReceived,
            ct);

        await SeedOrderAsync(
            context,
            SeedIds.PurchaseOrderOffice,
            SeedIds.SupplierOfficeWorld,
            PurchaseOrderStatus.Draft,
            OrderDatePending,
            ExpectedDatePending,
            ct);
    }

    private static async Task SeedOrderAsync(
        InvenTUDbContext context,
        Guid orderId,
        Guid supplierId,
        PurchaseOrderStatus status,
        DateTimeOffset orderDate,
        DateTimeOffset expectedDate,
        CancellationToken ct)
    {
        if (await context.PurchaseOrders.AnyAsync(po => po.Id == orderId, ct))
            return;

        var order = new PurchaseOrder
        {
            Id = orderId,
            SupplierId = supplierId,
            Status = status,
            OrderDate = orderDate.DateTime.ToUniversalTime(),
            ExpectedDate = expectedDate.DateTime.ToUniversalTime(),
            CreatedByUserId = SeedIds.DevAdminUserId,
        };

        context.PurchaseOrders.Add(order);

        var lines = orderId == SeedIds.PurchaseOrderTech
            ? BuildTechLines()
            : BuildOfficeLines();

        context.PurchaseOrderLines.AddRange(lines);
        await context.SaveChangesAsync(ct);
    }

    private static List<PurchaseOrderLine> BuildTechLines() =>
    [
        new PurchaseOrderLine
        {
            Id              = SeedIds.PoLineTechPhone1,
            PurchaseOrderId = SeedIds.PurchaseOrderTech,
            ProductId       = SeedIds.ProductPhone1,
            Quantity        = 50,
            UnitPrice       = 310.00m,
        },
        new PurchaseOrderLine
        {
            Id              = SeedIds.PoLineTechPhone2,
            PurchaseOrderId = SeedIds.PurchaseOrderTech,
            ProductId       = SeedIds.ProductPhone2,
            Quantity        = 25,
            UnitPrice       = 510.00m,
        },
        new PurchaseOrderLine
        {
            Id              = SeedIds.PoLineTechLaptop1,
            PurchaseOrderId = SeedIds.PurchaseOrderTech,
            ProductId       = SeedIds.ProductLaptop1,
            Quantity        = 10,
            UnitPrice       = 720.00m,
        },
    ];

    private static List<PurchaseOrderLine> BuildOfficeLines() =>
    [
        new PurchaseOrderLine
        {
            Id              = SeedIds.PoLineOfficePaper1,
            PurchaseOrderId = SeedIds.PurchaseOrderOffice,
            ProductId       = SeedIds.ProductPaper1,
            Quantity        = 200,
            UnitPrice       = 2.80m,
        },
        new PurchaseOrderLine
        {
            Id              = SeedIds.PoLineOfficeFile1,
            PurchaseOrderId = SeedIds.PurchaseOrderOffice,
            ProductId       = SeedIds.ProductFile1,
            Quantity        = 100,
            UnitPrice       = 1.10m,
        },
    ];

}
