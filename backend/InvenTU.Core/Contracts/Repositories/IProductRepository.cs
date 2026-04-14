using InvenTU.Core.DTOs.Common;
using InvenTU.Core.DTOs.Products;
using InvenTU.Core.Entities;

namespace InvenTU.Core.Contracts.Repositories;

public interface IProductRepository
{
    Task<PagedResult<Product>> GetPagedAsync(ProductQueryParams query, CancellationToken cancellationToken = default);
    Task<Product?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Product?> GetByIdWithStockAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> SkuExistsAsync(string sku, CancellationToken cancellationToken = default);
    Task<bool> CategoryExistsAsync(Guid categoryId, CancellationToken cancellationToken = default);
    Task AddAsync(Product product, CancellationToken cancellationToken = default);
    Task UpdateAsync(Product product, CancellationToken cancellationToken = default);
    Task<decimal> GetTotalStockAsync(Guid productId, CancellationToken cancellationToken = default);
    Task ArchiveAsync(Guid id, DateTime deletedAt, CancellationToken cancellationToken = default);
}
