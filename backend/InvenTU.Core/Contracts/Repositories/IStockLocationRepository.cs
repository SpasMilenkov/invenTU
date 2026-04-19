using InvenTU.Core.DTOs.StockLocations;
using InvenTU.Core.Entities;

namespace InvenTU.Core.Contracts.Repositories;

public interface IStockLocationRepository
{
    Task<IReadOnlyList<StockLocationDto>> GetAllByWarehouseAsync(Guid warehouseId, string? zone, CancellationToken cancellationToken = default);
    Task<StockLocationDto?> GetByIdAsync(Guid warehouseId, Guid id, CancellationToken cancellationToken = default);
    Task<StockLocation?> GetForUpdateAsync(Guid warehouseId, Guid id, CancellationToken cancellationToken = default);
    Task<decimal> GetTotalStockAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(StockLocation location, CancellationToken cancellationToken = default);
    Task UpdateAsync(StockLocation location, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
