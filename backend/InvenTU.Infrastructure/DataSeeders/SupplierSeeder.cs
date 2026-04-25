using InvenTU.Core.Entities;
using InvenTU.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InvenTU.Infrastructure.DataSeeders;

internal static class SupplierSeeder
{
    private static readonly IReadOnlyList<Supplier> Seed =
    [
        new Supplier
        {
            Id           = SeedIds.SupplierTechDistrib,
            Name         = "TechDistrib Ltd",
            IsActive     = true,
            ContactEmail = "orders@techdistrib.com",
            ContactPhone = "+359 2 100 2000",
            Address      = "15 Tech Park Boulevard, Sofia",
        },
        new Supplier
        {
            Id           = SeedIds.SupplierOfficeWorld,
            Name         = "OfficeWorld",
            IsActive     = true,
            ContactEmail = "supply@officeworld.com",
            ContactPhone = "+359 52 300 4000",
            Address      = "8 Commerce Street, Varna",
        },
        new Supplier
        {
            Id           = SeedIds.SupplierBudgetParts,
            Name         = "BudgetParts",
            IsActive     = true,
            ContactEmail = "sales@budgetparts.com",
            ContactPhone = "+359 32 500 6000",
            Address      = "22 Industrial Zone, Plovdiv",
        },
    ];

    internal static void Seed_(InvenTUDbContext context)
    {
        var existingIds = context.Suppliers
            .Select(s => s.Id)
            .ToHashSet();

        var toAdd = Seed.Where(s => !existingIds.Contains(s.Id)).ToList();
        if (toAdd.Count == 0) return;

        context.Suppliers.AddRange(toAdd);
        context.SaveChanges();
    }

    internal static async Task SeedAsync(InvenTUDbContext context, CancellationToken ct)
    {
        var existingIds = await context.Suppliers
            .Select(s => s.Id)
            .ToHashSetAsync(ct);

        var toAdd = Seed.Where(s => !existingIds.Contains(s.Id)).ToList();
        if (toAdd.Count == 0) return;

        context.Suppliers.AddRange(toAdd);
        await context.SaveChangesAsync(ct);
    }
}
