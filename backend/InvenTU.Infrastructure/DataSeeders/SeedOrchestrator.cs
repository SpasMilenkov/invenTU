using InvenTU.Infrastructure.Data;

namespace InvenTU.Infrastructure.DataSeeders;

/// <summary>
/// Orchestrates all seeders that have no dependency on Identity users.
/// Called automatically by EF Core during every <c>MigrateAsync()</c> /
/// <c>dotnet ef database update</c> run via <c>UseSeeding</c> /
/// <c>UseAsyncSeeding</c>.
///
/// Seeder execution order must respect FK dependencies:
///   Warehouses → StockLocations
///   Categories (parents → children, single call is fine because they share one SaveChanges)
///   Suppliers
///   Products (needs Category + Warehouse)
///   ProductSuppliers (needs Product + Supplier)
///   StockItems (needs Product + StockLocation)
///   Alerts (needs Product + Warehouse + StockLocation)
///
/// Seeders that require Identity users (StockMovements, PurchaseOrders,
/// AlertUserStates) are handled separately by <see cref="DevDataSeeder"/>.
/// </summary>
public static class SeedOrchestrator
{
    /// <summary>
    /// Synchronous entry point — used by EF Core tooling (<c>UseSeeding</c>).
    /// </summary>
    public static void Seed(InvenTUDbContext context)
    {
        WarehouseSeeder.Seed_(context);
        CategorySeeder.Seed_(context);
        SupplierSeeder.Seed_(context);
        StockLocationSeeder.Seed_(context);
        ProductSeeder.Seed_(context);
        ProductSupplierSeeder.Seed_(context);
        StockItemSeeder.Seed_(context);
        AlertSeeder.Seed_(context);
    }

    /// <summary>
    /// Asynchronous entry point — used at runtime (<c>UseAsyncSeeding</c>).
    /// </summary>
    public static async Task SeedAsync(InvenTUDbContext context, CancellationToken ct = default)
    {
        await WarehouseSeeder.SeedAsync(context, ct);
        await CategorySeeder.SeedAsync(context, ct);
        await SupplierSeeder.SeedAsync(context, ct);
        await StockLocationSeeder.SeedAsync(context, ct);
        await ProductSeeder.SeedAsync(context, ct);
        await ProductSupplierSeeder.SeedAsync(context, ct);
        await StockItemSeeder.SeedAsync(context, ct);
        await AlertSeeder.SeedAsync(context, ct);
    }
}
