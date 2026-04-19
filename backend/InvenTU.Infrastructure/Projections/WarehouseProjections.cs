using System.Linq.Expressions;
using InvenTU.Core.DTOs.Warehouses;
using InvenTU.Core.Entities;

namespace InvenTU.Infrastructure.Projections;

internal static class WarehouseProjections
{
    internal static readonly Expression<Func<Warehouse, WarehouseDto>> ToDto = w => new WarehouseDto
    {
        Id = w.Id,
        Code = w.Code,
        Name = w.Name,
        IsActive = w.IsActive,
        Location = w.Location,
        MaxStockLevel = w.MaxStockLevel,
        TotalLocations = w.StockLocations.Count,
        TotalStockItems = w.StockLocations.SelectMany(l => l.StockItems).Count(),
        TotalQuantity = w.StockLocations.SelectMany(l => l.StockItems).Sum(si => si.Quantity),
    };
}
