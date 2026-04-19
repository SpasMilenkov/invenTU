using System.Linq.Expressions;
using InvenTU.Core.DTOs.StockLocations;
using InvenTU.Core.Entities;

namespace InvenTU.Infrastructure.Projections;

internal static class StockLocationProjections
{
    internal static readonly Expression<Func<StockLocation, StockLocationDto>> ToDto = sl => new StockLocationDto
    {
        Id = sl.Id,
        WarehouseId = sl.WarehouseId,
        Zone = sl.Zone,
        Aisle = sl.Aisle,
        Shelf = sl.Shelf,
        Bin = sl.Bin,
        MaxCapacity = sl.MaxCapacity,
        FullLocationCode = sl.Warehouse.Code + "-" + sl.Zone
            + (sl.Aisle == null ? "" : "-" + sl.Aisle)
            + (sl.Shelf == null ? "" : "-" + sl.Shelf)
            + (sl.Bin == null ? "" : "-" + sl.Bin),
        StockItemCount = sl.StockItems.Count,
        TotalQuantity = sl.StockItems.Sum(si => si.Quantity),
    };
}
