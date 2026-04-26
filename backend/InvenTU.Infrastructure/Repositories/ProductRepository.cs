using InvenTU.Core.Contracts.Repositories;
using InvenTU.Core.DTOs.Common;
using InvenTU.Core.DTOs.Products;
using InvenTU.Core.Entities;
using InvenTU.Infrastructure.Data;
using InvenTU.Infrastructure.Projections;
using Microsoft.EntityFrameworkCore;

namespace InvenTU.Infrastructure.Repositories;

public sealed class ProductRepository(InvenTUDbContext dbContext) : IProductRepository
{
    public Task<ProductDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => dbContext.Products
            .Where(p => p.Id == id)
            .Select(ProductProjections.ToDto)
            .FirstOrDefaultAsync(cancellationToken);

    public Task<Product?> GetForUpdateAsync(Guid id, CancellationToken cancellationToken = default)
        => dbContext.Products
            .FirstOrDefaultAsync(p => p.Id == id && p.DeletedAt == null, cancellationToken);

    public Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default)
        => dbContext.Products
            .AnyAsync(p => p.Id == id && p.DeletedAt == null, cancellationToken);

    public Task<bool> SkuExistsAsync(string sku, CancellationToken cancellationToken = default)
        => dbContext.Products
            .AnyAsync(p => p.SKU == sku, cancellationToken);

    public Task<bool> CategoryExistsAsync(Guid categoryId, CancellationToken cancellationToken = default)
        => dbContext.Categories
            .AnyAsync(c => c.Id == categoryId, cancellationToken);

    public async Task AddAsync(Product product, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(product);
        dbContext.Products.Add(product);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(Product product, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(product);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<decimal> GetTotalStockAsync(Guid productId, CancellationToken cancellationToken = default)
    {
        var sum = await dbContext.StockItems
            .Where(si => si.ProductId == productId)
            .SumAsync(si => (decimal?)si.Quantity, cancellationToken);
        return sum ?? 0m;
    }

    public async Task ArchiveAsync(Guid id, DateTime deletedAt, CancellationToken cancellationToken = default)
    {
        await dbContext.Products
            .Where(p => p.Id == id && p.DeletedAt == null)
            .ExecuteUpdateAsync(
                setters => setters
                    .SetProperty(p => p.DeletedAt, deletedAt)
                    .SetProperty(p => p.UpdatedAt, deletedAt),
                cancellationToken);
    }

    public async Task<bool> RestoreAsync(Guid id, DateTime updatedAt, CancellationToken cancellationToken = default)
    {
        var affected = await dbContext.Products
            .Where(p => p.Id == id && p.DeletedAt != null)
            .ExecuteUpdateAsync(
                setters => setters
                    .SetProperty(p => p.DeletedAt, (DateTime?)null)
                    .SetProperty(p => p.UpdatedAt, updatedAt),
                cancellationToken);
        return affected > 0;
    }

    public Task<PagedResult<ProductDto>> GetPagedAsync(
        ProductQueryParams query,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(query);

        return string.IsNullOrWhiteSpace(query.Search)
            ? BrowsePagedAsync(query, cancellationToken)
            : SearchPagedAsync(query, cancellationToken);
    }

    private async Task<HashSet<Guid>> GetDescendantCategoryIdsAsync(
        Guid categoryId,
        CancellationToken cancellationToken)
    {
        var ids = await dbContext.Database
            .SqlQuery<Guid>($"""
                WITH RECURSIVE category_tree AS (
                    SELECT "Id"
                    FROM   "Categories"
                    WHERE  "Id" = {categoryId}

                    UNION ALL

                    SELECT c."Id"
                    FROM   "Categories"      c
                    INNER JOIN category_tree ct ON ct."Id" = c."ParentCategoryId"
                )
                SELECT "Id" AS "Value"
                FROM   category_tree
                """)
            .ToListAsync(cancellationToken);

        return [.. ids];
    }

    private async Task<PagedResult<ProductDto>> BrowsePagedAsync(
        ProductQueryParams query,
        CancellationToken cancellationToken)
    {
        var q = query.Archive switch
        {
            ArchiveStatusFilter.Active   => dbContext.Products.Where(p => p.DeletedAt == null),
            ArchiveStatusFilter.Archived => dbContext.Products.Where(p => p.DeletedAt != null),
            ArchiveStatusFilter.All      => dbContext.Products.AsQueryable(),
            _                            => dbContext.Products.Where(p => p.DeletedAt == null),
        };

        if (query.CategoryId.HasValue)
        {
            var categoryIds = await GetDescendantCategoryIdsAsync(query.CategoryId.Value, cancellationToken);
            q = q.Where(p => categoryIds.Contains(p.CategoryId));
        }

        if (query.IsActive.HasValue)
            q = q.Where(p => p.IsActive == query.IsActive.Value);

        var totalCount = await q.CountAsync(cancellationToken);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);
        var page = Math.Max(1, query.Page);

        var items = await q
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(ProductProjections.ToDto)
            .ToListAsync(cancellationToken);

        return PagedResult<ProductDto>.Create(items, totalCount, page, pageSize);
    }

    /// <summary>
    /// Executes a relevance-ranked, trigram-accelerated product search against SKU, Name, and Barcode.
    /// </summary>
    /// <remarks>
    /// <para>
    /// This path is taken when <see cref="ProductQueryParams.Search"/> is non-empty. It uses raw
    /// interpolated SQL via <c>Database.SqlQuery&lt;T&gt;</c> (EF Core 8+) because three things
    /// are required that LINQ cannot express:
    /// </para>
    /// <list type="bullet">
    ///   <item><description>
    ///     <c>ILIKE</c> across <c>SKU</c>, <c>Name</c>, <b>and</b> <c>Barcode</c> —
    ///     the LINQ browse path only covered the first two.
    ///   </description></item>
    ///   <item><description>
    ///     A <c>CASE</c>-based priority column in <c>ORDER BY</c>, with <c>similarity()</c>
    ///     (pg_trgm) as a tiebreaker — neither has an EF Core translation.
    ///   </description></item>
    ///   <item><description>
    ///     GIN trigram indexes on all three columns to satisfy leading-wildcard
    ///     <c>ILIKE '%term%'</c> without a sequential scan.
    ///   </description></item>
    /// </list>
    /// <para>
    /// Every interpolated hole is converted to a named <c>NpgsqlParameter</c> by EF Core,
    /// so there is no SQL injection risk from query values. ILIKE metacharacters
    /// (<c>%</c>, <c>_</c>, <c>\</c>) in the search term are escaped before use in
    /// pattern positions; the raw term is preserved for <c>similarity()</c> and exact
    /// <c>lower()</c> comparisons where metacharacters carry no special meaning.
    /// </para>
    /// </remarks>
    private async Task<PagedResult<ProductDto>> SearchPagedAsync(
        ProductQueryParams query,
        CancellationToken cancellationToken)
    {
        var rawTerm = query.Search!.Trim();
        var pageSize = Math.Clamp(query.PageSize, 1, 100);
        var page = Math.Clamp(query.Page, 1, 1000);
        var offset = (page - 1) * pageSize;

        var searchTerm = rawTerm.Length > 100 ? rawTerm[..100] : rawTerm;
        var escapedTerm = searchTerm
            .Replace(@"\", @"\\")
            .Replace("%", @"\%")
            .Replace("_", @"\_");

        // Resolve the full category subtree once, reused in both COUNT and data queries
        HashSet<Guid>? categoryIds = query.CategoryId.HasValue
            ? await GetDescendantCategoryIdsAsync(query.CategoryId.Value, cancellationToken)
            : null;

        // EF Core translates Contains() on a local collection to = ANY(@p),
        // but raw SQL needs a different approach — we pass the resolved IDs
        // as an array parameter using the ANY(array) PostgreSQL syntax.
        var categoryIdsParam = categoryIds?.ToArray();
        var hasCategoryFilter = categoryIdsParam is { Length: > 0 };

        var isActiveParam = (object?)query.IsActive ?? DBNull.Value;
        var archiveMode = (int)query.Archive;

        var totalCount = await dbContext.Database
            .SqlQuery<int>($"""
                SELECT COUNT(*)::int AS "Value"
                FROM   "Products" p
                WHERE  (
                           ({archiveMode} = 0 AND p."DeletedAt" IS NULL)
                        OR ({archiveMode} = 1 AND p."DeletedAt" IS NOT NULL)
                        OR ({archiveMode} = 2)
                       )
                  AND  (
                           p."SKU"     ILIKE '%' || {escapedTerm} || '%' ESCAPE '\'
                        OR p."Name"    ILIKE '%' || {escapedTerm} || '%' ESCAPE '\'
                        OR p."Barcode" ILIKE '%' || {escapedTerm} || '%' ESCAPE '\'
                       )
                  AND  (NOT {hasCategoryFilter} OR p."CategoryId" = ANY({categoryIdsParam}))
                  AND  ({isActiveParam}::boolean IS NULL OR p."IsActive" = {isActiveParam}::boolean)
                """)
            .SingleAsync(cancellationToken);

        if (totalCount == 0)
            return PagedResult<ProductDto>.Create([], 0, page, pageSize);

        var rows = await dbContext.Database
            .SqlQuery<ProductSearchResultRow>($"""
                SELECT
                    p."Id",
                    p."SKU",
                    p."Name",
                    p."CategoryId",
                    c."Name"        AS "CategoryName",
                    p."PrimaryWarehouseId",
                    p."UnitPrice",
                    p."CostPrice",
                    p."UnitOfMeasure",
                    p."IsActive",
                    p."Description",
                    p."Barcode",
                    p."MinStockLevel",
                    p."MaxStockLevel",
                    p."ReorderPoint",
                    COALESCE(
                        (SELECT SUM(si."Quantity")
                         FROM   "StockItems" si
                         WHERE  si."ProductId" = p."Id"),
                        0
                    )               AS "TotalStock",
                    p."CreatedAt",
                    p."UpdatedAt",
                    p."DeletedAt",
                    CASE
                        WHEN lower(p."SKU")     = lower({searchTerm})                THEN 0
                        WHEN p."Barcode" IS NOT NULL
                         AND lower(p."Barcode") = lower({searchTerm})                THEN 0
                        WHEN lower(p."Name")    = lower({searchTerm})                THEN 1
                        WHEN p."SKU"  ILIKE {escapedTerm} || '%' ESCAPE '\'         THEN 2
                        WHEN p."Name" ILIKE {escapedTerm} || '%' ESCAPE '\'         THEN 3
                        ELSE 4
                    END             AS "MatchPriority"
                FROM  "Products"   p
                INNER JOIN "Categories" c ON c."Id" = p."CategoryId"
                WHERE (
                          ({archiveMode} = 0 AND p."DeletedAt" IS NULL)
                       OR ({archiveMode} = 1 AND p."DeletedAt" IS NOT NULL)
                       OR ({archiveMode} = 2)
                      )
                  AND (
                          p."SKU"     ILIKE '%' || {escapedTerm} || '%' ESCAPE '\'
                       OR p."Name"    ILIKE '%' || {escapedTerm} || '%' ESCAPE '\'
                       OR p."Barcode" ILIKE '%' || {escapedTerm} || '%' ESCAPE '\'
                      )
                  AND (NOT {hasCategoryFilter} OR p."CategoryId" = ANY({categoryIdsParam}))
                  AND ({isActiveParam}::boolean IS NULL OR p."IsActive" = {isActiveParam}::boolean)
                ORDER BY
                    "MatchPriority" ASC,
                    GREATEST(
                        similarity(p."Name",    {searchTerm}),
                        similarity(p."SKU",     {searchTerm}),
                        COALESCE(similarity(p."Barcode", {searchTerm}), 0)
                    ) DESC,
                    p."CreatedAt" DESC
                LIMIT  {pageSize}
                OFFSET {offset}
                """)
            .ToListAsync(cancellationToken);

        var dtos = rows.ConvertAll(r => r.ToDto());
        return PagedResult<ProductDto>.Create(dtos, totalCount, page, pageSize);
    }

}
