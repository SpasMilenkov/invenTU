using InvenTU.Core.Entities;
using InvenTU.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InvenTU.Infrastructure.DataSeeders;

internal static class ProductSupplierSeeder
{
    private static readonly IReadOnlyList<ProductSupplier> Seed =
    [
        // PHN-001: Smartphone X12
        new ProductSupplier
        {
            ProductId    = SeedIds.ProductPhone1,
            SupplierId   = SeedIds.SupplierTechDistrib,
            IsPrimary    = true,
            SupplierSKU  = "TD-PHN-X12",
            UnitCost     = 310.00m,
            LeadTimeDays = 7,
        },
        new ProductSupplier
        {
            ProductId    = SeedIds.ProductPhone1,
            SupplierId   = SeedIds.SupplierBudgetParts,
            IsPrimary    = false,
            SupplierSKU  = "BP-X12-MOB",
            UnitCost     = 325.00m,
            LeadTimeDays = 14,
        },

        // PHN-002: Smartphone X13 Pro
        new ProductSupplier
        {
            ProductId    = SeedIds.ProductPhone2,
            SupplierId   = SeedIds.SupplierTechDistrib,
            IsPrimary    = true,
            SupplierSKU  = "TD-PHN-X13P",
            UnitCost     = 510.00m,
            LeadTimeDays = 7,
        },

        // LPT-001: Laptop UltraBook 14
        new ProductSupplier
        {
            ProductId    = SeedIds.ProductLaptop1,
            SupplierId   = SeedIds.SupplierTechDistrib,
            IsPrimary    = true,
            SupplierSKU  = "TD-LPT-UB14",
            UnitCost     = 720.00m,
            LeadTimeDays = 10,
        },
        new ProductSupplier
        {
            ProductId    = SeedIds.ProductLaptop1,
            SupplierId   = SeedIds.SupplierBudgetParts,
            IsPrimary    = false,
            SupplierSKU  = "BP-UB14-LAP",
            UnitCost     = 745.00m,
            LeadTimeDays = 21,
        },

        // LPT-002: Laptop WorkStation 15
        new ProductSupplier
        {
            ProductId    = SeedIds.ProductLaptop2,
            SupplierId   = SeedIds.SupplierTechDistrib,
            IsPrimary    = true,
            SupplierSKU  = "TD-LPT-WS15",
            UnitCost     = 1_150.00m,
            LeadTimeDays = 10,
        },

        // OFF-001: A4 Paper Ream
        new ProductSupplier
        {
            ProductId    = SeedIds.ProductPaper1,
            SupplierId   = SeedIds.SupplierOfficeWorld,
            IsPrimary    = true,
            SupplierSKU  = "OW-A4-80G",
            UnitCost     = 2.80m,
            LeadTimeDays = 3,
        },

        // OFF-002: Lever Arch File
        new ProductSupplier
        {
            ProductId    = SeedIds.ProductFile1,
            SupplierId   = SeedIds.SupplierOfficeWorld,
            IsPrimary    = true,
            SupplierSKU  = "OW-LAF-A4-BLK",
            UnitCost     = 1.10m,
            LeadTimeDays = 3,
        },
    ];

    internal static void Seed_(InvenTUDbContext context)
    {
        // Composite PK — check both keys together.
        var existingKeys = context.ProductSuppliers
            .Select(ps => new { ps.ProductId, ps.SupplierId })
            .ToHashSet();

        var toAdd = Seed
            .Where(ps => !existingKeys.Contains(new { ps.ProductId, ps.SupplierId }))
            .ToList();

        if (toAdd.Count == 0) return;

        context.ProductSuppliers.AddRange(toAdd);
        context.SaveChanges();
    }

    internal static async Task SeedAsync(InvenTUDbContext context, CancellationToken ct)
    {
        var existingKeys = await context.ProductSuppliers
            .Select(ps => new { ps.ProductId, ps.SupplierId })
            .ToHashSetAsync(ct);

        var toAdd = Seed
            .Where(ps => !existingKeys.Contains(new { ps.ProductId, ps.SupplierId }))
            .ToList();

        if (toAdd.Count == 0) return;

        context.ProductSuppliers.AddRange(toAdd);
        await context.SaveChangesAsync(ct);
    }
}
