namespace InvenTU.Core.DTOs.Dashboard;

/// <summary>
/// Represents the aggregated stock quantity for a single product category,
/// used to populate the category breakdown widget on the dashboard.
/// </summary>
public sealed class StockByCategoryDto
{
    /// <summary>The unique identifier of the category.</summary>
    public Guid CategoryId { get; init; }

    /// <summary>The display name of the category.</summary>
    public string CategoryName { get; init; } = string.Empty;

    /// <summary>
    /// The total quantity of all active, non-deleted products in this category
    /// summed across every stock location.
    /// </summary>
    public decimal TotalQuantity { get; init; }
}
