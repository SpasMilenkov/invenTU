using InvenTU.Core.Entities;
using InvenTU.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InvenTU.Infrastructure.DataSeeders;

internal static class CategorySeeder
{
    // Parents must appear before their children so the self-referential FK is
    // satisfied within the same SaveChanges call if neither row exists yet.
    private static readonly IReadOnlyList<Category> Seed =
    [
        // Root categories
        new Category
        {
            Id               = SeedIds.CatElectronics,
            Name             = "Electronics",
            Description      = "Electronic devices and accessories",
            ParentCategoryId = null,
        },
        new Category
        {
            Id               = SeedIds.CatOfficeSupplies,
            Name             = "Office Supplies",
            Description      = "Stationery, storage and workplace essentials",
            ParentCategoryId = null,
        },

        // Electronics sub-categories
        new Category
        {
            Id               = SeedIds.CatPhones,
            Name             = "Phones",
            Description      = "Smartphones and mobile devices",
            ParentCategoryId = SeedIds.CatElectronics,
        },
        new Category
        {
            Id               = SeedIds.CatLaptops,
            Name             = "Laptops",
            Description      = "Laptops and portable computers",
            ParentCategoryId = SeedIds.CatElectronics,
        },

        // Office Supplies sub-categories
        new Category
        {
            Id               = SeedIds.CatPaperStationery,
            Name             = "Paper & Stationery",
            Description      = "Paper products, pens and writing materials",
            ParentCategoryId = SeedIds.CatOfficeSupplies,
        },
        new Category
        {
            Id               = SeedIds.CatStorageOrg,
            Name             = "Storage & Organisation",
            Description      = "Files, folders and desk organisation",
            ParentCategoryId = SeedIds.CatOfficeSupplies,
        },
    ];

    internal static void Seed_(InvenTUDbContext context)
    {
        var existingIds = context.Categories
            .Select(c => c.Id)
            .ToHashSet();

        var toAdd = Seed.Where(c => !existingIds.Contains(c.Id)).ToList();
        if (toAdd.Count == 0) return;

        context.Categories.AddRange(toAdd);
        context.SaveChanges();
    }

    internal static async Task SeedAsync(InvenTUDbContext context, CancellationToken ct)
    {
        var existingIds = await context.Categories
            .Select(c => c.Id)
            .ToHashSetAsync(ct);

        var toAdd = Seed.Where(c => !existingIds.Contains(c.Id)).ToList();
        if (toAdd.Count == 0) return;

        context.Categories.AddRange(toAdd);
        await context.SaveChangesAsync(ct);
    }
}
