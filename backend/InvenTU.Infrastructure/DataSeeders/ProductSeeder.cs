using InvenTU.Core.Entities;
using InvenTU.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InvenTU.Infrastructure.DataSeeders;

internal static class ProductSeeder
{
    private static readonly DateTime SeedDate =
        new(2025, 1, 15, 9, 0, 0, DateTimeKind.Utc);

    private static readonly IReadOnlyList<Product> Seed =
    [
        // Phones
        new Product
        {
            Id                 = SeedIds.ProductPhone1,
            SKU                = "PHN-001",
            Name               = "Smartphone X12",
            Description        = "6.1\" OLED, 128 GB, dual SIM",
            Barcode            = "5901234123457",
            CategoryId         = SeedIds.CatPhones,
            PrimaryWarehouseId = SeedIds.WarehouseMain,
            UnitPrice          = 499.99m,
            CostPrice          = 310.00m,
            UnitOfMeasure      = "unit",
            IsActive           = true,
            MinStockLevel      = 10,
            MaxStockLevel      = 200,
            ReorderPoint       = 30,
            CreatedAt          = SeedDate,
            UpdatedAt          = SeedDate,
        },
        new Product
        {
            Id                 = SeedIds.ProductPhone2,
            SKU                = "PHN-002",
            Name               = "Smartphone X13 Pro",
            Description        = "6.7\" AMOLED, 256 GB, triple camera",
            Barcode            = "5901234123464",
            CategoryId         = SeedIds.CatPhones,
            PrimaryWarehouseId = SeedIds.WarehouseMain,
            UnitPrice          = 799.99m,
            CostPrice          = 510.00m,
            UnitOfMeasure      = "unit",
            IsActive           = true,
            MinStockLevel      = 5,
            MaxStockLevel      = 100,
            ReorderPoint       = 15,
            CreatedAt          = SeedDate,
            UpdatedAt          = SeedDate,
        },

        // Laptops
        new Product
        {
            Id                 = SeedIds.ProductLaptop1,
            SKU                = "LPT-001",
            Name               = "Laptop UltraBook 14",
            Description        = "14\" IPS, Intel i5, 16 GB RAM, 512 GB SSD",
            Barcode            = "5901234123471",
            CategoryId         = SeedIds.CatLaptops,
            PrimaryWarehouseId = SeedIds.WarehouseMain,
            UnitPrice          = 1_099.99m,
            CostPrice          = 720.00m,
            UnitOfMeasure      = "unit",
            IsActive           = true,
            MinStockLevel      = 5,
            MaxStockLevel      = 50,
            ReorderPoint       = 10,
            CreatedAt          = SeedDate,
            UpdatedAt          = SeedDate,
        },
        new Product
        {
            // Intentionally seeded with low stock to trigger an Alert.
            Id                 = SeedIds.ProductLaptop2,
            SKU                = "LPT-002",
            Name               = "Laptop WorkStation 15",
            Description        = "15.6\" 4K, Intel i7, 32 GB RAM, 1 TB SSD",
            Barcode            = "5901234123488",
            CategoryId         = SeedIds.CatLaptops,
            PrimaryWarehouseId = SeedIds.WarehouseNorth,
            UnitPrice          = 1_799.99m,
            CostPrice          = 1_150.00m,
            UnitOfMeasure      = "unit",
            IsActive           = true,
            MinStockLevel      = 3,
            MaxStockLevel      = 30,
            ReorderPoint       = 8,
            CreatedAt          = SeedDate,
            UpdatedAt          = SeedDate,
        },

        // Paper & Stationery
        new Product
        {
            // Intentionally seeded near ReorderPoint to trigger an Alert.
            Id                 = SeedIds.ProductPaper1,
            SKU                = "OFF-001",
            Name               = "A4 Paper Ream 500",
            Description        = "500 sheets, 80 g/m², white",
            Barcode            = "5901234123495",
            CategoryId         = SeedIds.CatPaperStationery,
            PrimaryWarehouseId = SeedIds.WarehouseNorth,
            UnitPrice          = 4.99m,
            CostPrice          = 2.80m,
            UnitOfMeasure      = "ream",
            IsActive           = true,
            MinStockLevel      = 50,
            MaxStockLevel      = 1_000,
            ReorderPoint       = 100,
            CreatedAt          = SeedDate,
            UpdatedAt          = SeedDate,
        },

        // Storage & Organisation
        new Product
        {
            Id                 = SeedIds.ProductFile1,
            SKU                = "OFF-002",
            Name               = "Lever Arch File A4",
            Description        = "A4, 75 mm spine, black",
            Barcode            = "5901234123501",
            CategoryId         = SeedIds.CatStorageOrg,
            PrimaryWarehouseId = SeedIds.WarehouseNorth,
            UnitPrice          = 2.49m,
            CostPrice          = 1.10m,
            UnitOfMeasure      = "unit",
            IsActive           = true,
            MinStockLevel      = 20,
            MaxStockLevel      = 500,
            ReorderPoint       = 50,
            CreatedAt          = SeedDate,
            UpdatedAt          = SeedDate,
        },
    ];

    internal static void Seed_(InvenTUDbContext context)
    {
        var existingSkus = context.Products
            .Select(p => p.SKU)
            .ToHashSet();

        var toAdd = Seed.Where(p => !existingSkus.Contains(p.SKU)).ToList();
        if (toAdd.Count == 0) return;

        context.Products.AddRange(toAdd);
        context.SaveChanges();
    }

    internal static async Task SeedAsync(InvenTUDbContext context, CancellationToken ct)
    {
        var existingSkus = await context.Products
            .Select(p => p.SKU)
            .ToHashSetAsync(ct);

        var toAdd = Seed.Where(p => !existingSkus.Contains(p.SKU)).ToList();
        if (toAdd.Count == 0) return;

        context.Products.AddRange(toAdd);
        await context.SaveChangesAsync(ct);
    }
}
