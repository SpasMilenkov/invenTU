using InvenTU.Core.Entities; // adjust to wherever StockLocation lives in your project

namespace InvenTU.Core.DTOs.Stock;

/// <summary>
/// Normalised representation of any stock movement broadcast over SignalR.
/// All four movement types (Receipt, Issue, Transfer, Adjustment) map to this shape.
/// </summary>
public sealed class StockMovementLiveDto
{
    /// <summary>The StockMovements.Id from the database.</summary>
    public Guid MovementId { get; init; }

    /// <summary>One of: Receipt | Issue | Transfer | Adjustment | Count | WriteOff</summary>
    public string MovementType { get; init; } = string.Empty;

    public Guid ProductId { get; init; }

    /// <summary>May be empty — frontend falls back to a truncated ProductId.</summary>
    public string ProductName { get; init; } = string.Empty;

    /// <summary>Raw magnitude — always positive.</summary>
    public decimal Quantity { get; init; }

    /// <summary>
    /// Signed for directional display:
    ///   +Q  Receipt / positive Adjustment
    ///   -Q  Issue / WriteOff / negative Adjustment
    ///    Q  Transfer (direction is conveyed by source→dest names instead)
    /// </summary>
    public decimal DisplayQuantity { get; init; }

    /// <summary>Null for Receipt / Issue / Adjustment; source warehouse for Transfer.</summary>
    public string? SourceWarehouseName { get; init; }

    /// <summary>Primary warehouse for Receipt / Issue / Adjustment; destination for Transfer.</summary>
    public string? DestinationWarehouseName { get; init; }

    /// <summary>Human-readable location code, e.g. "A-3-S2-B4". Null for Transfers.</summary>
    public string? LocationCode { get; init; }

    /// <summary>ReasonCode for Issue; adjustment Status for Adjustment.</summary>
    public string? StatusOrReason { get; init; }

    public string? ReferenceNumber { get; init; }

    public string? Notes { get; init; }

    public DateTimeOffset OccurredAt { get; init; }

    // ─── helpers ────────────────────────────────────────────────────────────

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
