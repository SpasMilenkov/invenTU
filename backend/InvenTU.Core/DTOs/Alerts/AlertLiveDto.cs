// InvenTU.Core/DTOs/Alerts/AlertLiveDto.cs
using InvenTU.Core.Entities;

namespace InvenTU.Core.DTOs.Alerts;

public sealed class AlertLiveDto
{
    // Identity
    public Guid AlertId { get; init; }
    public string AlertType { get; init; } = string.Empty;
    public string? Message { get; init; }

    // Read state
    public bool IsRead { get; init; }
    public DateTimeOffset CreatedAt { get; init; }
    public DateTime? ResolvedAt { get; init; }

    // NEW: stock context
    public Guid? ProductId { get; init; }
    public string? ProductName { get; init; }      // from Alert.Product.Name
    public string? SKU { get; init; }              // from Alert.Product.SKU

    public Guid? WarehouseId { get; init; }
    public string? WarehouseName { get; init; }    // from Alert.Warehouse.Name

    public Guid? StockLocationId { get; init; }
    public string? LocationCode { get; init; }     // from Alert.StockLocation.Code

    public decimal? CurrentQuantity { get; init; }
    public int? MinStockLevel { get; init; }
    public decimal? ReorderSuggestion { get; init; }

    /// Derived on the server so the client doesn't have to compute it.
    /// Null when MinStockLevel is 0 or unknown.
    public int? StockHealthPct { get; init; }

    /// <summary>
    /// Builds a human-readable location code directly from the entity.
    /// Zone is always included; Aisle, Shelf, Bin are appended only when non-null/empty.
    ///
    /// Examples:
    ///   Zone="A"                                     → "A"
    ///   Zone="A", Aisle="3"                          → "A-3"
    ///   Zone="A", Aisle="3", Shelf="S2"              → "A-3-S2"
    ///   Zone="A", Aisle="3", Shelf="S2", Bin="B4"   → "A-3-S2-B4"
    /// </summary>
    public static string? FormatLocation(StockLocation? location)
    {
        if (location is null) return null;

        var parts = new[] { location.Zone, location.Aisle, location.Shelf, location.Bin }
            .Where(p => !string.IsNullOrWhiteSpace(p));

        return string.Join("-", parts);
    }
}
