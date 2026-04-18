namespace InvenTU.Core.DTOs.Products;

/// <summary>
/// Internal row type used exclusively by the raw-SQL search path in
/// <see cref="InvenTU.Infrastructure.Repositories.ProductRepository"/>.
/// Properties are named to match SQL column aliases exactly so that
/// EF Core's Database.SqlQuery can map without configuration.
/// Do not expose this type through the API surface.
/// </summary>
public sealed class ProductSearchResultRow
{
    public Guid Id { get; init; }
    public string SKU { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public Guid CategoryId { get; init; }
    public string CategoryName { get; init; } = string.Empty;
    public Guid? PrimaryWarehouseId { get; init; }
    public decimal UnitPrice { get; init; }
    public decimal CostPrice { get; init; }
    public string UnitOfMeasure { get; init; } = string.Empty;
    public bool IsActive { get; init; }
    public string? Description { get; init; }
    public string? Barcode { get; init; }
    public int MinStockLevel { get; init; }
    public int MaxStockLevel { get; init; }
    public int ReorderPoint { get; init; }
    public decimal TotalStock { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
    public DateTime? DeletedAt { get; init; }

    /// <summary>
    /// Computed by the SQL CASE expression.
    /// 0 = exact SKU/barcode match, 1 = exact name, 2 = SKU prefix,
    /// 3 = name prefix, 4 = any substring. Used only for ordering.
    /// </summary>
    public int MatchPriority { get; init; }

    public ProductDto ToDto() => new()
    {
        Id = Id,
        SKU = SKU,
        Name = Name,
        CategoryId = CategoryId,
        CategoryName = CategoryName,
        PrimaryWarehouseId = PrimaryWarehouseId,
        UnitPrice = UnitPrice,
        CostPrice = CostPrice,
        UnitOfMeasure = UnitOfMeasure,
        IsActive = IsActive,
        Description = Description,
        Barcode = Barcode,
        MinStockLevel = MinStockLevel,
        MaxStockLevel = MaxStockLevel,
        ReorderPoint = ReorderPoint,
        TotalStock = TotalStock,
        CreatedAt = CreatedAt,
        UpdatedAt = UpdatedAt,
        DeletedAt = DeletedAt,
    };
}
