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
                    .SetProperty(p => p.UpdatedAt, deletedAt)
                    .SetProperty(p => p.IsActive, false),
                cancellationToken);
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

    private async Task<PagedResult<ProductDto>> BrowsePagedAsync(
        ProductQueryParams query,
        CancellationToken cancellationToken)
    {
        var q = dbContext.Products.AsQueryable();

        if (query.CategoryId.HasValue)
            q = q.Where(p => p.CategoryId == query.CategoryId.Value);

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
        var rawTerm  = query.Search!.Trim();
        var pageSize = Math.Clamp(query.PageSize, 1, 100);
        var page     = Math.Clamp(query.Page, 1, 1000);
        var offset   = (page - 1) * pageSize;
    
        var searchTerm = rawTerm.Length > 100 ? rawTerm[..100] : rawTerm;
    
        // escape ILIKE metacharacters so % and _ in user input are treated
        // as literals. The backslash must be escaped first to avoid double-escaping.
        // searchTerm (unescaped) is still used for similarity() and lower() calls
        // where metacharacters have no special meaning.
        var escapedTerm = searchTerm
            .Replace(@"\", @"\\")
            .Replace("%",  @"\%")
            .Replace("_",  @"\_");
    
        var categoryIdParam = (object?)query.CategoryId ?? DBNull.Value;
        var isActiveParam   = (object?)query.IsActive   ?? DBNull.Value;
    
        var totalCount = await dbContext.Database
            .SqlQuery<int>($"""
                SELECT COUNT(*)::int AS "Value"
                FROM   "Products" p
                WHERE  (
                           p."SKU"     ILIKE '%' || {escapedTerm} || '%' ESCAPE '\'
                        OR p."Name"    ILIKE '%' || {escapedTerm} || '%' ESCAPE '\'
                        OR p."Barcode" ILIKE '%' || {escapedTerm} || '%' ESCAPE '\'
                       )
                  AND  ({categoryIdParam}::uuid    IS NULL OR p."CategoryId" = {categoryIdParam}::uuid)
                  AND  ({isActiveParam}::boolean   IS NULL OR p."IsActive"   = {isActiveParam}::boolean)
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
                    c."Name"                   AS "CategoryName",
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
                    )                          AS "TotalStock",
                    p."CreatedAt",
                    p."UpdatedAt",
                    p."DeletedAt",
                    CASE
                        WHEN lower(p."SKU")     = lower({searchTerm})                       THEN 0
                        WHEN p."Barcode" IS NOT NULL
                         AND lower(p."Barcode") = lower({searchTerm})                       THEN 0
                        WHEN lower(p."Name")    = lower({searchTerm})                       THEN 1
                        WHEN p."SKU"  ILIKE {escapedTerm} || '%' ESCAPE '\'                THEN 2
                        WHEN p."Name" ILIKE {escapedTerm} || '%' ESCAPE '\'                THEN 3
                        ELSE 4
                    END                        AS "MatchPriority"
                FROM  "Products"   p
                INNER JOIN "Categories" c ON c."Id" = p."CategoryId"
                WHERE (
                          p."SKU"     ILIKE '%' || {escapedTerm} || '%' ESCAPE '\'
                       OR p."Name"    ILIKE '%' || {escapedTerm} || '%' ESCAPE '\'
                       OR p."Barcode" ILIKE '%' || {escapedTerm} || '%' ESCAPE '\'
                      )
                  AND ({categoryIdParam}::uuid    IS NULL OR p."CategoryId" = {categoryIdParam}::uuid)
                  AND ({isActiveParam}::boolean   IS NULL OR p."IsActive"   = {isActiveParam}::boolean)
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
