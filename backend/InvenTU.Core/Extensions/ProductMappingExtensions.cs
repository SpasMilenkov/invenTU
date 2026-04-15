using InvenTU.Core.DTOs.Products;
using InvenTU.Core.Entities;

namespace InvenTU.Core.Extensions;

public static class ProductMappingExtensions
{
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
