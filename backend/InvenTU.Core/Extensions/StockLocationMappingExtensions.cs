using InvenTU.Core.DTOs.StockLocations;
using InvenTU.Core.Entities;

namespace InvenTU.Core.Extensions;

public static class StockLocationMappingExtensions
{
    public static StockLocation ToEntity(this CreateStockLocationRequest request, Guid warehouseId)
    {
        ArgumentNullException.ThrowIfNull(request);

        return new StockLocation
        {
            Id = Guid.NewGuid(),
            WarehouseId = warehouseId,
            Zone = request.Zone.Trim().ToUpperInvariant(),
            Aisle = request.Aisle?.Trim().ToUpperInvariant(),
            Shelf = request.Shelf?.Trim().ToUpperInvariant(),
            Bin = request.Bin?.Trim().ToUpperInvariant(),
            MaxCapacity = request.MaxCapacity,
        };
    }

    public static void ApplyUpdate(this StockLocation location, UpdateStockLocationRequest request)
    {
        ArgumentNullException.ThrowIfNull(location);
        ArgumentNullException.ThrowIfNull(request);

        location.Zone = request.Zone.Trim().ToUpperInvariant();
        location.Aisle = request.Aisle?.Trim().ToUpperInvariant();
        location.Shelf = request.Shelf?.Trim().ToUpperInvariant();
        location.Bin = request.Bin?.Trim().ToUpperInvariant();
        location.MaxCapacity = request.MaxCapacity;
    }
}
