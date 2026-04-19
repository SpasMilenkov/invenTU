using InvenTU.Core.Contracts.Repositories;
using InvenTU.Core.DTOs.StockLocations;
using InvenTU.Core.Entities;
using InvenTU.Infrastructure.Data;
using InvenTU.Infrastructure.Projections;
using Microsoft.EntityFrameworkCore;

namespace InvenTU.Infrastructure.Repositories;

public sealed class StockLocationRepository(InvenTUDbContext dbContext) : IStockLocationRepository
{
    public async Task<IReadOnlyList<StockLocationDto>> GetAllByWarehouseAsync(Guid warehouseId, string? zone, CancellationToken cancellationToken = default)
    {
        var query = dbContext.StockLocations
            .Where(sl => sl.WarehouseId == warehouseId);

        if (!string.IsNullOrWhiteSpace(zone))
        {
            query = query.Where(sl => sl.Zone == zone.Trim().ToUpperInvariant());
        }

        return await query
            .OrderBy(sl => sl.Zone)
            .ThenBy(sl => sl.Aisle)
            .ThenBy(sl => sl.Shelf)
            .ThenBy(sl => sl.Bin)
            .Select(StockLocationProjections.ToDto)
            .ToListAsync(cancellationToken);
    }

    public Task<StockLocationDto?> GetByIdAsync(Guid warehouseId, Guid id, CancellationToken cancellationToken = default)
        => dbContext.StockLocations
            .Where(sl => sl.Id == id && sl.WarehouseId == warehouseId)
            .Select(StockLocationProjections.ToDto)
            .FirstOrDefaultAsync(cancellationToken);

    public Task<StockLocation?> GetForUpdateAsync(Guid warehouseId, Guid id, CancellationToken cancellationToken = default)
        => dbContext.StockLocations
            .FirstOrDefaultAsync(sl => sl.Id == id && sl.WarehouseId == warehouseId, cancellationToken);

    public async Task<decimal> GetTotalStockAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var sum = await dbContext.StockItems
            .Where(si => si.StockLocationId == id)
            .SumAsync(si => (decimal?)si.Quantity, cancellationToken);
        return sum ?? 0m;
    }

    public async Task AddAsync(StockLocation location, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(location);
        dbContext.StockLocations.Add(location);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(StockLocation location, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(location);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        await dbContext.StockLocations
            .Where(sl => sl.Id == id)
            .ExecuteDeleteAsync(cancellationToken);
    }
}
