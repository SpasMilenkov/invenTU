using System.Linq.Expressions;
using InvenTU.Core.DTOs.Stock;
using InvenTU.Core.Entities;

namespace InvenTU.Infrastructure.Projections;

internal static class StockItemProjections
{
    internal static readonly Expression<Func<StockItem, StockItemDto>> ToDto = si => new StockItemDto
    {
        Id = si.Id,
        ProductId = si.ProductId,
        ProductName = si.Product.Name,
        ProductSku = si.Product.SKU,
        StockLocationId = si.StockLocationId,
        FullLocationCode = si.StockLocation.Warehouse.Code + "-" + si.StockLocation.Zone
            + (si.StockLocation.Aisle == null ? "" : "-" + si.StockLocation.Aisle)
            + (si.StockLocation.Shelf == null ? "" : "-" + si.StockLocation.Shelf)
            + (si.StockLocation.Bin == null ? "" : "-" + si.StockLocation.Bin),
        WarehouseId = si.StockLocation.WarehouseId,
        WarehouseName = si.StockLocation.Warehouse.Name,
        Quantity = si.Quantity,
        QuantityReserved = si.QuantityReserved,
        QuantityAvailable = si.Quantity - si.QuantityReserved,
    };
}
