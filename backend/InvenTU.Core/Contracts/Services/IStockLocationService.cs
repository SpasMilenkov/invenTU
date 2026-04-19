using InvenTU.Core.DTOs.StockLocations;

namespace InvenTU.Core.Contracts.Services;

public interface IStockLocationService
{
    Task<IReadOnlyList<StockLocationDto>> GetAllByWarehouseAsync(Guid warehouseId, string? zone, CancellationToken cancellationToken = default);
    Task<StockLocationDto> GetByIdAsync(Guid warehouseId, Guid id, CancellationToken cancellationToken = default);
    Task<StockLocationDto> CreateAsync(Guid warehouseId, CreateStockLocationRequest request, CancellationToken cancellationToken = default);
    Task<StockLocationDto> UpdateAsync(Guid warehouseId, Guid id, UpdateStockLocationRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid warehouseId, Guid id, CancellationToken cancellationToken = default);
}
