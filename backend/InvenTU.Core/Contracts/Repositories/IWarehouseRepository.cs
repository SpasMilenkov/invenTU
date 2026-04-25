using InvenTU.Core.DTOs.Common;
using InvenTU.Core.DTOs.Warehouses;
using InvenTU.Core.Entities;

namespace InvenTU.Core.Contracts.Repositories;

public interface IWarehouseRepository
{
    Task<PagedResult<WarehouseDto>> GetPagedAsync(
        int page,
        int pageSize,
        string? search,
        WarehouseStatusFilter status,
        CancellationToken cancellationToken = default);
    Task<WarehouseDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Warehouse?> GetForUpdateAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> CodeExistsAsync(string code, CancellationToken cancellationToken = default);
    Task<decimal> GetTotalStockAsync(Guid warehouseId, CancellationToken cancellationToken = default);
    Task AddAsync(Warehouse warehouse, CancellationToken cancellationToken = default);
    Task UpdateAsync(Warehouse warehouse, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
