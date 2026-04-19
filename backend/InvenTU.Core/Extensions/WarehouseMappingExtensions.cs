using InvenTU.Core.DTOs.Warehouses;
using InvenTU.Core.Entities;

namespace InvenTU.Core.Extensions;

public static class WarehouseMappingExtensions
{
    public static Warehouse ToEntity(this CreateWarehouseRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        return new Warehouse
        {
            Id = Guid.NewGuid(),
            Code = request.Code.Trim().ToUpperInvariant(),
            Name = request.Name.Trim(),
            IsActive = request.IsActive,
            Location = request.Location?.Trim(),
            MaxStockLevel = request.MaxStockLevel,
        };
    }

    public static void ApplyUpdate(this Warehouse warehouse, UpdateWarehouseRequest request)
    {
        ArgumentNullException.ThrowIfNull(warehouse);
        ArgumentNullException.ThrowIfNull(request);

        warehouse.Name = request.Name.Trim();
        warehouse.Location = request.Location?.Trim();
        warehouse.MaxStockLevel = request.MaxStockLevel;
    }
}
