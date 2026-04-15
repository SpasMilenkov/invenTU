using System.Linq.Expressions;
using InvenTU.Core.DTOs.Products;
using InvenTU.Core.Entities;

namespace InvenTU.Infrastructure.Projections;

internal static class ProductProjections
{
    internal static readonly Expression<Func<Product, ProductDto>> ToDto = p => new ProductDto
    {
        Id = p.Id,
        SKU = p.SKU,
        Name = p.Name,
        CategoryId = p.CategoryId,
        CategoryName = p.Category.Name,
        PrimaryWarehouseId = p.PrimaryWarehouseId,
        UnitPrice = p.UnitPrice,
        CostPrice = p.CostPrice,
        UnitOfMeasure = p.UnitOfMeasure,
        IsActive = p.IsActive,
        Description = p.Description,
        Barcode = p.Barcode,
        MinStockLevel = p.MinStockLevel,
        MaxStockLevel = p.MaxStockLevel,
        ReorderPoint = p.ReorderPoint,
        TotalStock = p.StockItems.Sum(si => si.Quantity),
        CreatedAt = p.CreatedAt,
        UpdatedAt = p.UpdatedAt,
        DeletedAt = p.DeletedAt,
    };
}
