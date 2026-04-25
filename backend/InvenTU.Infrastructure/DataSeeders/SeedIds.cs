namespace InvenTU.Infrastructure.DataSeeders;

/// <summary>
/// Hardcoded, deterministic GUIDs for every seeded entity.
/// Namespaced by prefix so they're readable in test assertions:
///   aa = Warehouses, bb = Categories, cc = StockLocations,
///   dd = Suppliers,  ee = Products,   ff = StockItems,
///   11 = StockMovements, 22 = PurchaseOrders, 33 = PO Lines,
///   44 = Alerts, 55 = Dev Users
/// </summary>
public static class SeedIds
{
    // ── Warehouses ────────────────────────────────────────────────────────────
    public static readonly Guid WarehouseMain  = Guid.Parse("aaaaaaaa-0001-0000-0000-000000000000");
    public static readonly Guid WarehouseNorth = Guid.Parse("aaaaaaaa-0002-0000-0000-000000000000");

    // ── StockLocations ────────────────────────────────────────────────────────
    public static readonly Guid LocationMainA1S1   = Guid.Parse("cccccccc-0001-0000-0000-000000000000");
    public static readonly Guid LocationMainA1S2   = Guid.Parse("cccccccc-0002-0000-0000-000000000000");
    public static readonly Guid LocationNorthB1S1  = Guid.Parse("cccccccc-0003-0000-0000-000000000000");
    public static readonly Guid LocationNorthB1S2  = Guid.Parse("cccccccc-0004-0000-0000-000000000000");

    // ── Categories ────────────────────────────────────────────────────────────
    public static readonly Guid CatElectronics     = Guid.Parse("bbbbbbbb-0001-0000-0000-000000000000");
    public static readonly Guid CatPhones          = Guid.Parse("bbbbbbbb-0002-0000-0000-000000000000");
    public static readonly Guid CatLaptops         = Guid.Parse("bbbbbbbb-0003-0000-0000-000000000000");
    public static readonly Guid CatOfficeSupplies  = Guid.Parse("bbbbbbbb-0004-0000-0000-000000000000");
    public static readonly Guid CatPaperStationery = Guid.Parse("bbbbbbbb-0005-0000-0000-000000000000");
    public static readonly Guid CatStorageOrg      = Guid.Parse("bbbbbbbb-0006-0000-0000-000000000000");

    // ── Suppliers ─────────────────────────────────────────────────────────────
    public static readonly Guid SupplierTechDistrib = Guid.Parse("dddddddd-0001-0000-0000-000000000000");
    public static readonly Guid SupplierOfficeWorld = Guid.Parse("dddddddd-0002-0000-0000-000000000000");
    public static readonly Guid SupplierBudgetParts = Guid.Parse("dddddddd-0003-0000-0000-000000000000");

    // ── Products ──────────────────────────────────────────────────────────────
    public static readonly Guid ProductPhone1  = Guid.Parse("eeeeeeee-0001-0000-0000-000000000000");
    public static readonly Guid ProductPhone2  = Guid.Parse("eeeeeeee-0002-0000-0000-000000000000");
    public static readonly Guid ProductLaptop1 = Guid.Parse("eeeeeeee-0003-0000-0000-000000000000");
    public static readonly Guid ProductLaptop2 = Guid.Parse("eeeeeeee-0004-0000-0000-000000000000");
    public static readonly Guid ProductPaper1  = Guid.Parse("eeeeeeee-0005-0000-0000-000000000000");
    public static readonly Guid ProductFile1   = Guid.Parse("eeeeeeee-0006-0000-0000-000000000000");

    // ── StockItems ────────────────────────────────────────────────────────────
    public static readonly Guid StockItemPhone1  = Guid.Parse("ffffffff-0001-0000-0000-000000000000");
    public static readonly Guid StockItemPhone2  = Guid.Parse("ffffffff-0002-0000-0000-000000000000");
    public static readonly Guid StockItemLaptop1 = Guid.Parse("ffffffff-0003-0000-0000-000000000000");
    public static readonly Guid StockItemLaptop2 = Guid.Parse("ffffffff-0004-0000-0000-000000000000");
    public static readonly Guid StockItemPaper1  = Guid.Parse("ffffffff-0005-0000-0000-000000000000");
    public static readonly Guid StockItemFile1   = Guid.Parse("ffffffff-0006-0000-0000-000000000000");

    // ── StockMovements ────────────────────────────────────────────────────────
    public static readonly Guid MovementPhone1Init  = Guid.Parse("11111111-0001-0000-0000-000000000000");
    public static readonly Guid MovementPhone2Init  = Guid.Parse("11111111-0002-0000-0000-000000000000");
    public static readonly Guid MovementLaptop1Init = Guid.Parse("11111111-0003-0000-0000-000000000000");
    public static readonly Guid MovementLaptop2Init = Guid.Parse("11111111-0004-0000-0000-000000000000");
    public static readonly Guid MovementPaper1Init  = Guid.Parse("11111111-0005-0000-0000-000000000000");
    public static readonly Guid MovementFile1Init   = Guid.Parse("11111111-0006-0000-0000-000000000000");

    // ── PurchaseOrders ────────────────────────────────────────────────────────
    public static readonly Guid PurchaseOrderTech   = Guid.Parse("22222222-0001-0000-0000-000000000000");
    public static readonly Guid PurchaseOrderOffice = Guid.Parse("22222222-0002-0000-0000-000000000000");

    // ── PurchaseOrderLines ────────────────────────────────────────────────────
    public static readonly Guid PoLineTechPhone1   = Guid.Parse("33333333-0001-0000-0000-000000000000");
    public static readonly Guid PoLineTechPhone2   = Guid.Parse("33333333-0002-0000-0000-000000000000");
    public static readonly Guid PoLineTechLaptop1  = Guid.Parse("33333333-0003-0000-0000-000000000000");
    public static readonly Guid PoLineOfficePaper1 = Guid.Parse("33333333-0004-0000-0000-000000000000");
    public static readonly Guid PoLineOfficeFile1  = Guid.Parse("33333333-0005-0000-0000-000000000000");

    // ── Alerts ────────────────────────────────────────────────────────────────
    public static readonly Guid AlertLaptop2LowStock = Guid.Parse("44444444-0001-0000-0000-000000000000");
    public static readonly Guid AlertPaper1LowStock  = Guid.Parse("44444444-0002-0000-0000-000000000000");

    // ── Dev Users ─────────────────────────────────────────────────────────────
    // Referenced by DevUserSeeder (must create these users with exactly these IDs)
    // and by DevDataSeeder (for FK references in movements / purchase orders).
    public static readonly Guid DevAdminUserId = Guid.Parse("55555555-0001-0000-0000-000000000000");
    public static readonly Guid DevStaffUserId = Guid.Parse("55555555-0002-0000-0000-000000000000");
}
