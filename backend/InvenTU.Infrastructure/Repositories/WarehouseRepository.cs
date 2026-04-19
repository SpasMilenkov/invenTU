using InvenTU.Core.Contracts.Repositories;
using InvenTU.Core.DTOs.Warehouses;
using InvenTU.Core.Entities;
using InvenTU.Infrastructure.Data;
using InvenTU.Infrastructure.Projections;
using Microsoft.EntityFrameworkCore;

namespace InvenTU.Infrastructure.Repositories;

public sealed class WarehouseRepository(InvenTUDbContext dbContext) : IWarehouseRepository
{
    public async Task<IReadOnlyList<WarehouseDto>> GetAllAsync(CancellationToken cancellationToken = default)
        => await dbContext.Warehouses
            .OrderBy(w => w.Code)
            .Select(WarehouseProjections.ToDto)
            .ToListAsync(cancellationToken);

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
}
