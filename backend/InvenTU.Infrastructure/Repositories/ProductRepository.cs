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
    public async Task<PagedResult<ProductDto>> GetPagedAsync(
        ProductQueryParams query,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(query);

        var q = dbContext.Products
            .Where(p => p.DeletedAt == null);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = $"%{query.Search.Trim()}%";
            q = q.Where(p => EF.Functions.ILike(p.Name, search)
                           || EF.Functions.ILike(p.SKU, search));
        }

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

    public Task<ProductDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => dbContext.Products
            .Where(p => p.Id == id && p.DeletedAt == null)
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
}
