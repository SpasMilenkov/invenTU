using InvenTU.Core.Contracts.Repositories;
using InvenTU.Core.DTOs.Stock;
using InvenTU.Infrastructure.Data;
using InvenTU.Infrastructure.Projections;
using Microsoft.EntityFrameworkCore;

namespace InvenTU.Infrastructure.Repositories;

public sealed class StockItemRepository(InvenTUDbContext dbContext) : IStockItemRepository
{
    public async Task<IReadOnlyList<StockItemDto>> GetStockAsync(StockQueryParams query, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(query);

        var q = dbContext.StockItems.AsQueryable();

        if (query.ProductId.HasValue)
        {
            q = q.Where(si => si.ProductId == query.ProductId.Value);
        }

        if (query.WarehouseId.HasValue)
        {
            q = q.Where(si => si.StockLocation.WarehouseId == query.WarehouseId.Value);
        }

        if (query.ExcludeZeroStock)
        {
            q = q.Where(si => si.Quantity - si.QuantityReserved > 0);
        }

        return await q
            .OrderBy(si => si.StockLocation.WarehouseId)
            .ThenBy(si => si.StockLocationId)
            .Select(StockItemProjections.ToDto)
            .ToListAsync(cancellationToken);
    }

    public async Task<StockSummaryDto?> GetSummaryByProductAsync(Guid productId, CancellationToken cancellationToken = default)
    {
        var product = await dbContext.Products
            .Where(p => p.Id == productId && p.DeletedAt == null)
            .Select(p => new { p.Id, p.Name, p.SKU })
            .FirstOrDefaultAsync(cancellationToken);

        if (product is null)
        {
            return null;
        }

        var byWarehouse = await dbContext.StockItems
            .Where(si => si.ProductId == productId)
            .GroupBy(si => new { si.StockLocation.WarehouseId, WarehouseName = si.StockLocation.Warehouse.Name })
            .Select(g => new WarehouseStockSummaryDto
            {
                WarehouseId = g.Key.WarehouseId,
                WarehouseName = g.Key.WarehouseName,
                Quantity = g.Sum(si => si.Quantity),
                QuantityReserved = g.Sum(si => si.QuantityReserved),
                QuantityAvailable = g.Sum(si => si.Quantity) - g.Sum(si => si.QuantityReserved),
            })
            .ToListAsync(cancellationToken);

        return new StockSummaryDto
        {
            ProductId = product.Id,
            ProductName = product.Name,
            ProductSku = product.SKU,
            TotalQuantity = byWarehouse.Sum(w => w.Quantity),
            TotalQuantityReserved = byWarehouse.Sum(w => w.QuantityReserved),
            TotalQuantityAvailable = byWarehouse.Sum(w => w.QuantityAvailable),
            WarehouseCount = byWarehouse.Count,
            ByWarehouse = byWarehouse,
        };
    }
}
