namespace InvenTU.Core.DTOs.Stock.StockMovement;

/// <summary>
/// Read model returned by <c>GET /api/v1/stock/movements</c>.
/// Represents a single stock movement audit record with all related
/// entity names resolved via database joins so callers never need to
/// perform secondary lookups.
/// </summary>
public sealed class StockMovementDto
{
    /// <summary>Gets the unique identifier of the stock movement record.</summary>
    public Guid Id { get; init; }

    /// <summary>
    /// Gets the movement type as a string (e.g. <c>"Receipt"</c>, <c>"Issue"</c>,
    /// <c>"Transfer"</c>, <c>"Adjustment"</c>, <c>"Count"</c>).
    /// </summary>
    public string MovementType { get; init; } = default!;

    /// <summary>
    /// Gets the movement status as a string (e.g. <c>"Active"</c>,
    /// <c>"Pending"</c>, <c>"Approved"</c>, <c>"Rejected"</c>).
    /// </summary>
    public string Status { get; init; } = default!;

    /// <summary>Gets the quantity of stock involved in the movement.</summary>
    public decimal Quantity { get; init; }

    // Product

    /// <summary>Gets the identifier of the product involved in the movement.</summary>
    public Guid ProductId { get; init; }

    /// <summary>Gets the display name of the product.</summary>
    public string ProductName { get; init; } = default!;

    /// <summary>Gets the stock-keeping unit code of the product.</summary>
    public string ProductSku { get; init; } = default!;

    // Warehouses

    /// <summary>
    /// Gets the identifier of the source warehouse.
    /// <see langword="null"/> for movement types that have no source warehouse
    /// (e.g. <c>Receipt</c>).
    /// </summary>
    public Guid? SourceWarehouseId { get; init; }

    /// <summary>
    /// Gets the display name of the source warehouse.
    /// <see langword="null"/> when <see cref="SourceWarehouseId"/> is <see langword="null"/>.
    /// </summary>
    public string? SourceWarehouseName { get; init; }

    /// <summary>
    /// Gets the identifier of the destination warehouse.
    /// <see langword="null"/> for movement types that have no destination warehouse
    /// (e.g. <c>Issue</c>).
    /// </summary>
    public Guid? DestinationWarehouseId { get; init; }

    /// <summary>
    /// Gets the display name of the destination warehouse.
    /// <see langword="null"/> when <see cref="DestinationWarehouseId"/> is <see langword="null"/>.
    /// </summary>
    public string? DestinationWarehouseName { get; init; }

    // Stock location

    /// <summary>
    /// Gets the identifier of the stock location involved.
    /// <see langword="null"/> when no specific bin/shelf was recorded.
    /// </summary>
    public Guid? StockLocationId { get; init; }

    /// <summary>
    /// Gets a human-readable label for the stock location composed from its
    /// zone, aisle, and shelf fields (e.g. <c>"Zone A / Aisle 3 / Shelf 2"</c>).
    /// <see langword="null"/> when <see cref="StockLocationId"/> is <see langword="null"/>.
    /// </summary>
    public string? StockLocationLabel { get; init; }

    // Audit

    /// <summary>
    /// Gets the identifier of the user who performed the movement.
    /// Always populated — never <see langword="null"/>.
    /// </summary>
    public Guid PerformedBy { get; init; }

    /// <summary>
    /// Gets the full display name (<c>FirstName LastName</c>) of the user who
    /// performed the movement, resolved via a database join.
    /// Always populated — never <see langword="null"/> or empty.
    /// </summary>
    public string PerformedByName { get; init; } = default!;

    /// <summary>
    /// Gets the UTC timestamp at which the movement was created.
    /// Always populated — never <see langword="null"/>.
    /// </summary>
    public DateTime PerformedAt { get; init; }

    // Metadata

    /// <summary>
    /// Gets the reason code provided when the movement was created.
    /// <see langword="null"/> for movement types that do not require a reason code.
    /// </summary>
    public string? ReasonCode { get; init; }

    /// <summary>
    /// Gets the external reference number associated with the movement
    /// (e.g. a purchase order number for receipts).
    /// <see langword="null"/> when not provided.
    /// </summary>
    public string? ReferenceNumber { get; init; }

    /// <summary>Gets any free-text notes recorded alongside the movement.</summary>
    public string? Notes { get; init; }

    // Adjustment-specific

    /// <summary>
    /// Gets the physical count quantity recorded during a stock adjustment.
    /// <see langword="null"/> for all non-adjustment movement types.
    /// </summary>
    public decimal? CountedQuantity { get; init; }

    /// <summary>
    /// Gets the identifier of the user who reviewed (approved or rejected) the adjustment.
    /// <see langword="null"/> for non-adjustment movements or pending adjustments.
    /// </summary>
    public Guid? ReviewedByUserId { get; init; }

    /// <summary>
    /// Gets the full display name of the reviewing user, resolved via a database join.
    /// <see langword="null"/> when <see cref="ReviewedByUserId"/> is <see langword="null"/>.
    /// </summary>
    public string? ReviewedByName { get; init; }

    /// <summary>
    /// Gets the UTC timestamp at which the adjustment was reviewed.
    /// <see langword="null"/> for non-adjustment movements or pending adjustments.
    /// </summary>
    public DateTime? ReviewedAt { get; init; }
}
