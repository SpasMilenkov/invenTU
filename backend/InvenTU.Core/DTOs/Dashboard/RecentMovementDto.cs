namespace InvenTU.Core.DTOs.Dashboard;

/// <summary>
/// Represents a single stock movement entry surfaced on the dashboard.
/// Contains the product context needed for display without requiring a
/// separate product lookup from the caller.
/// </summary>
public sealed class RecentMovementDto
{
    /// <summary>The unique identifier of the stock movement record.</summary>
    public Guid Id { get; init; }

    /// <summary>The display name of the product involved in the movement.</summary>
    public string ProductName { get; init; } = string.Empty;

    /// <summary>The stock-keeping unit code of the product involved in the movement.</summary>
    public string SKU { get; init; } = string.Empty;

    /// <summary>
    /// The type of movement, e.g. <c>Inbound</c>, <c>Outbound</c>, or <c>Transfer</c>.
    /// Reflects the raw <c>MovementType</c> text stored in the database.
    /// </summary>
    public string MovementType { get; init; } = string.Empty;

    /// <summary>The number of units involved in this movement.</summary>
    public decimal Quantity { get; init; }

    /// <summary>
    /// The current status of the movement, e.g. <c>Completed</c>, <c>Pending</c>,
    /// or <c>Cancelled</c>.
    /// </summary>
    public string Status { get; init; } = string.Empty;

    /// <summary>The UTC timestamp at which this movement record was created.</summary>
    public DateTime CreatedAt { get; init; }
}
