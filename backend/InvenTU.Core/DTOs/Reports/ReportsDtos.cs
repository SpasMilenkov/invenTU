namespace InvenTU.Core.DTOs.Reports;

/// <summary>
/// Raw per-product data fetched from the database for turnover calculation.
/// </summary>
/// <param name="ProductId">Product identifier.</param>
/// <param name="ProductName">Product display name.</param>
/// <param name="SKU">Stock-keeping unit code.</param>
/// <param name="TotalUnitsIssued">
/// Sum of quantities on Issue movements within the reporting window
/// (status <c>Active</c> or <c>Approved</c> only).
/// </param>
/// <param name="AverageStockLevel">
/// Current on-hand quantity across all stock locations (point-in-time snapshot).
/// Always greater than zero — the repository filters out zero-stock products.
/// </param>
public sealed record ProductTurnoverData(
    Guid ProductId,
    string ProductName,
    string SKU,
    decimal TotalUnitsIssued,
    decimal AverageStockLevel);

/// <summary>
/// Aggregated result returned by <see cref="IReportsRepository.GetInventoryValuationDataAsync"/>.
/// </summary>
public sealed record InventoryValuationRaw(
    IReadOnlyList<ProductStockSnapshot> Products,
    IReadOnlyList<ProductPoLine> PoLines);

/// <summary>
/// Point-in-time on-hand quantity for a single product, with metadata for display and FIFO fallback.
/// </summary>
public sealed record ProductStockSnapshot(
    Guid ProductId,
    string SKU,
    string Name,
    string CategoryName,
    decimal OnHandQuantity,
    decimal CostPrice);

/// <summary>
/// A single purchase-order line used as a FIFO cost layer for a product.
/// </summary>
/// <param name="ProductId">The product this line covers.</param>
/// <param name="OrderDate">Date of the parent purchase order, used to sort layers oldest→newest.</param>
/// <param name="Quantity">Quantity received on this line.</param>
/// <param name="UnitPrice">Unit cost on this line.</param>
public sealed record ProductPoLine(
    Guid ProductId,
    DateTime OrderDate,
    decimal Quantity,
    decimal UnitPrice);
