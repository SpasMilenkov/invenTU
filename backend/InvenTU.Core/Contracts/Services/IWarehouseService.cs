using InvenTU.Core.DTOs.Common;
using InvenTU.Core.DTOs.Warehouses;

namespace InvenTU.Core.Contracts.Services;

public interface IWarehouseService
{
    Task<PagedResult<WarehouseDto>> GetAllAsync(
        int page,
        int pageSize,
        string? search,
        WarehouseStatusFilter status,
        CancellationToken cancellationToken = default);
    Task<WarehouseDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<WarehouseDto> CreateAsync(CreateWarehouseRequest request, CancellationToken cancellationToken = default);
    Task<WarehouseDto> UpdateAsync(Guid id, UpdateWarehouseRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task DeactivateAsync(Guid id, CancellationToken cancellationToken = default);
    Task ActivateAsync(Guid id, CancellationToken cancellationToken = default);
}
