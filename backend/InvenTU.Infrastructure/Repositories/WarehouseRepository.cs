using InvenTU.Core.Contracts.Repositories;
using InvenTU.Core.DTOs.Common;
using InvenTU.Core.DTOs.Warehouses;
using InvenTU.Core.Entities;
using InvenTU.Infrastructure.Data;
using InvenTU.Infrastructure.Projections;
using Microsoft.EntityFrameworkCore;

namespace InvenTU.Infrastructure.Repositories;

public sealed class WarehouseRepository(InvenTUDbContext dbContext) : IWarehouseRepository
{
    public async Task<PagedResult<WarehouseDto>> GetPagedAsync(
        int page,
        int pageSize,
        string? search,
        WarehouseStatusFilter status,
        CancellationToken cancellationToken = default)
    {
        if (page < 1)
        {
            page = 1;
        }

        if (pageSize < 1)
        {
            pageSize = 1;
        }
        else if (pageSize > 100)
        {
            pageSize = 100;
        }

        var query = dbContext.Warehouses.AsNoTracking();

        if (status == WarehouseStatusFilter.Active)
        {
            query = query.Where(w => w.IsActive);
        }
        else if (status == WarehouseStatusFilter.Inactive)
        {
            query = query.Where(w => !w.IsActive);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var pattern = $"%{EscapeLikePattern(search.Trim())}%";
            query = query.Where(w =>
                EF.Functions.ILike(w.Code, pattern, @"\") ||
                EF.Functions.ILike(w.Name, pattern, @"\"));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderBy(w => w.Code)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(WarehouseProjections.ToDto)
            .ToListAsync(cancellationToken);

        return PagedResult<WarehouseDto>.Create(items, totalCount, page, pageSize);
    }

    public Task<WarehouseDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => dbContext.Warehouses
            .Where(w => w.Id == id)
            .Select(WarehouseProjections.ToDto)
            .FirstOrDefaultAsync(cancellationToken);

    public Task<Warehouse?> GetForUpdateAsync(Guid id, CancellationToken cancellationToken = default)
        => dbContext.Warehouses
            .FirstOrDefaultAsync(w => w.Id == id, cancellationToken);

    public Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default)
        => dbContext.Warehouses
            .AnyAsync(w => w.Id == id, cancellationToken);

    public Task<bool> CodeExistsAsync(string code, CancellationToken cancellationToken = default)
        => dbContext.Warehouses
            .AnyAsync(w => w.Code == code, cancellationToken);

    public async Task<decimal> GetTotalStockAsync(Guid warehouseId, CancellationToken cancellationToken = default)
    {
        var sum = await dbContext.StockItems
            .Where(si => si.StockLocation.WarehouseId == warehouseId)
            .SumAsync(si => (decimal?)si.Quantity, cancellationToken);
        return sum ?? 0m;
    }

    public async Task AddAsync(Warehouse warehouse, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(warehouse);
        dbContext.Warehouses.Add(warehouse);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(Warehouse warehouse, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(warehouse);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        await dbContext.Warehouses
            .Where(w => w.Id == id)
            .ExecuteDeleteAsync(cancellationToken);
    }

    private static string EscapeLikePattern(string input)
        => input
            .Replace(@"\", @"\\")
            .Replace("%", @"\%")
            .Replace("_", @"\_");
}
