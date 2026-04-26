using InvenTU.Core.Enums;

namespace InvenTU.Core.DTOs.Stock.StockMovement;

/// <summary>
/// Query parameters accepted by <c>GET /api/v1/stock/movements</c>.
/// All filters are optional and are combined with AND logic.
/// Pagination defaults to page 1 with a page size of 50.
/// </summary>
public sealed class StockMovementQueryParams
{
    /// <summary>
    /// When set, restricts results to movements involving the specified product.
    /// </summary>
    public Guid? ProductId { get; init; }

    /// <summary>
    /// When set, restricts results to movements where the warehouse appears as
    /// either the source or the destination.
    /// </summary>
    public Guid? WarehouseId { get; init; }

    /// <summary>
    /// When set, restricts results to movements of the specified type
    /// (e.g. <see cref="MovementType.Receipt"/>, <see cref="MovementType.Issue"/>).
    /// </summary>
    public MovementType? Type { get; init; }

    /// <summary>
    /// When set, restricts results to movements created on or after this UTC timestamp.
    /// </summary>
    public DateTime? FromDate { get; init; }

    /// <summary>
    /// When set, restricts results to movements created on or before this UTC timestamp.
    /// </summary>
    public DateTime? ToDate { get; init; }

    /// <summary>
    /// The 1-based page number to return. Defaults to <c>1</c>.
    /// </summary>
    public int Page { get; init; } = 1;

    /// <summary>
    /// The maximum number of items to return per page. Defaults to <c>50</c>.
    /// The service layer caps this at 200 regardless of the value supplied.
    /// </summary>
    public int PageSize { get; init; } = 50;
}
