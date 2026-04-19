using InvenTU.Core.Contracts.Repositories;
using InvenTU.Core.DTOs.Dashboard;
using InvenTU.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InvenTU.Infrastructure.Repositories;

/// <summary>
/// Provides optimised data-access operations for the dashboard statistics endpoint.
/// Each method issues a single SQL round-trip; the service layer calls them
/// sequentially to remain safe with EF Core's non-thread-safe <c>DbContext</c>.
/// </summary>
public sealed class DashboardRepository(InvenTUDbContext dbContext) : IDashboardRepository
{
    // -------------------------------------------------------------------------
    // Private mapping records — used by EF Core SqlQuery<T> column-name binding.
    // Must be internal/private; never exposed through the public API surface.
    // -------------------------------------------------------------------------

    /// <summary>Internal projection record for the scalar metrics raw SQL query.</summary>
    private sealed record ScalarMetricsRow(
        int     TotalProducts,
        int     LowStockCount,
        decimal TotalStockValue);

    /// <summary>Internal projection record for the stock-by-category raw SQL query.</summary>
    private sealed record CategoryStockRow(
        Guid    CategoryId,
        string  CategoryName,
        decimal TotalQuantity);

    // -------------------------------------------------------------------------
    // Public interface implementation
    // -------------------------------------------------------------------------

    /// <inheritdoc />
    public async Task<(int TotalProducts, int LowStockCount, decimal TotalStockValue)>
        GetScalarMetricsAsync(CancellationToken cancellationToken = default)
    {
        // A single SQL pass over Products LEFT JOIN aggregated StockItems gives us
        // all three scalar metrics without rescanning either table.
        //
        // LowStockCount: a product counts as low-stock when its total available
        // quantity (COALESCE to 0 for products with no stock items) is strictly
        // less than its MinStockLevel.  Products with MinStockLevel = 0 can never
        // satisfy (0 < 0), so they are naturally excluded.
        //
        // TotalStockValue: sum of (total_qty × CostPrice) restricted to active,
        // non-deleted products only — orphan StockItems rows for archived products
        // are excluded by the WHERE clause on Products.
        var row = await dbContext.Database
            .SqlQuery<ScalarMetricsRow>($"""
                SELECT
                    COUNT(*)::int                                                          AS "TotalProducts",
                    COUNT(CASE WHEN COALESCE(stock.total_qty, 0) < p."MinStockLevel"
                               THEN 1 END)::int                                           AS "LowStockCount",
                    COALESCE(SUM(COALESCE(stock.total_qty, 0) * p."CostPrice"), 0)::numeric AS "TotalStockValue"
                FROM "Products" p
                LEFT JOIN (
                    SELECT "ProductId", SUM("Quantity") AS total_qty
                    FROM   "StockItems"
                    GROUP  BY "ProductId"
                ) stock ON stock."ProductId" = p."Id"
                WHERE p."DeletedAt" IS NULL
                  AND p."IsActive"  = TRUE
                """)
            .SingleAsync(cancellationToken);

        return (row.TotalProducts, row.LowStockCount, row.TotalStockValue);
    }

    /// <inheritdoc />
    public Task<int> GetActiveWarehouseCountAsync(CancellationToken cancellationToken = default)
        => dbContext.Warehouses
            .CountAsync(w => w.IsActive, cancellationToken);

    /// <inheritdoc />
    public async Task<IReadOnlyList<RecentMovementDto>> GetRecentMovementsAsync(
        int count,
        CancellationToken cancellationToken = default)
    {
        // EF Core generates a single JOIN + LIMIT query here; no N+1 risk.
        // StockMovements.Product is a required navigation, so the JOIN is INNER.
        var results = await dbContext.StockMovements
            .OrderByDescending(sm => sm.CreatedAt)
            .Take(count)
            .Select(sm => new RecentMovementDto
            {
                Id           = sm.Id,
                ProductName  = sm.Product.Name,
                SKU          = sm.Product.SKU,
                MovementType = sm.MovementType.ToString(),
                Quantity     = sm.Quantity,
                Status       = sm.Status.ToString(),
                CreatedAt    = sm.CreatedAt,
            })
            .ToListAsync(cancellationToken);

        return results;
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<StockByCategoryDto>> GetStockByCategoryAsync(
        int topN,
        CancellationToken cancellationToken = default)
    {
        // Raw SQL is used here instead of LINQ GroupBy because EF Core's translation
        // of GroupBy with cross-navigation-property keys (CategoryId + Category.Name)
        // can fall back to client-side evaluation on some EF Core versions, which
        // would load all StockItems rows into memory before grouping.
        //
        // The raw SQL path is explicit and predictable: one GROUP BY → ORDER BY →
        // LIMIT query with two JOINs.  Only stock belonging to active, non-deleted
        // products is included in the aggregation.
        var rows = await dbContext.Database
            .SqlQuery<CategoryStockRow>($"""
                SELECT
                    c."Id"                        AS "CategoryId",
                    c."Name"                      AS "CategoryName",
                    COALESCE(SUM(si."Quantity"), 0)::numeric AS "TotalQuantity"
                FROM  "Categories"  c
                INNER JOIN "Products"   p  ON p."CategoryId" = c."Id"
                                           AND p."DeletedAt"  IS NULL
                                           AND p."IsActive"   = TRUE
                INNER JOIN "StockItems" si ON si."ProductId"  = p."Id"
                GROUP  BY c."Id", c."Name"
                ORDER  BY "TotalQuantity" DESC
                LIMIT  {topN}
                """)
            .ToListAsync(cancellationToken);

        return rows.ConvertAll(r => new StockByCategoryDto
        {
            CategoryId    = r.CategoryId,
            CategoryName  = r.CategoryName,
            TotalQuantity = r.TotalQuantity,
        });
    }
}
