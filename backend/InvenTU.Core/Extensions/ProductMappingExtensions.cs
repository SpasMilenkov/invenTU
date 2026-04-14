using InvenTU.Core.DTOs.Products;
using InvenTU.Core.Entities;

namespace InvenTU.Core.Extensions;

public static class ProductMappingExtensions
{
    public static ProductDto ToDto(this Product product)
    {
        ArgumentNullException.ThrowIfNull(product);

        return new ProductDto
        {
            Id = product.Id,
            SKU = product.SKU,
            Name = product.Name,
            CategoryId = product.CategoryId,
            CategoryName = product.Category?.Name ?? string.Empty,
            PrimaryWarehouseId = product.PrimaryWarehouseId,
            UnitPrice = product.UnitPrice,
            CostPrice = product.CostPrice,
            UnitOfMeasure = product.UnitOfMeasure,
            IsActive = product.IsActive,
            Description = product.Description,
            Barcode = product.Barcode,
            MinStockLevel = product.MinStockLevel,
            MaxStockLevel = product.MaxStockLevel,
            ReorderPoint = product.ReorderPoint,
            TotalStock = product.StockItems.Sum(si => si.Quantity),
            CreatedAt = product.CreatedAt,
            UpdatedAt = product.UpdatedAt,
            DeletedAt = product.DeletedAt,
        };
    }

    public static Product ToEntity(this CreateProductRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        return new Product
        {
            Id = Guid.NewGuid(),
            SKU = request.SKU.Trim().ToUpperInvariant(),
            Name = request.Name.Trim(),
            CategoryId = request.CategoryId,
            PrimaryWarehouseId = request.PrimaryWarehouseId,
            UnitPrice = request.UnitPrice,
            CostPrice = request.CostPrice,
            UnitOfMeasure = request.UnitOfMeasure.Trim(),
            IsActive = request.IsActive,
            Description = request.Description?.Trim(),
            Barcode = request.Barcode?.Trim(),
            MinStockLevel = request.MinStockLevel,
            MaxStockLevel = request.MaxStockLevel,
            ReorderPoint = request.ReorderPoint,
            CreatedAt = DateTime.UtcNow,
        };
    }

    public static void ApplyUpdate(this Product product, UpdateProductRequest request)
    {
        ArgumentNullException.ThrowIfNull(product);
        ArgumentNullException.ThrowIfNull(request);

        product.Name = request.Name.Trim();
        product.CategoryId = request.CategoryId;
        product.PrimaryWarehouseId = request.PrimaryWarehouseId;
        product.UnitPrice = request.UnitPrice;
        product.CostPrice = request.CostPrice;
        product.UnitOfMeasure = request.UnitOfMeasure.Trim();
        product.IsActive = request.IsActive;
        product.Description = request.Description?.Trim();
        product.Barcode = request.Barcode?.Trim();
        product.MinStockLevel = request.MinStockLevel;
        product.MaxStockLevel = request.MaxStockLevel;
        product.ReorderPoint = request.ReorderPoint;
        product.UpdatedAt = DateTime.UtcNow;
    }
}
