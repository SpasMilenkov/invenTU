using InvenTU.Core.Contracts.Repositories;
using InvenTU.Core.DTOs.Common;
using InvenTU.Core.DTOs.Stock;
using InvenTU.Core.DTOs.Stock.StockMovement;
using InvenTU.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InvenTU.Infrastructure.Repositories;

/// <summary>
/// EF Core implementation of <see cref="IStockMovementRepository"/>.
/// Executes a single, fully-projected SQL query per request — all navigation
/// properties (product, warehouses, locations, users) are resolved via
/// database joins so no in-memory joining or secondary round-trips occur.
/// </summary>
public sealed class StockMovementRepository(InvenTUDbContext dbContext) : IStockMovementRepository
{
    /// <inheritdoc/>
    public async Task<PagedResult<StockMovementDto>> GetAsync(
        StockMovementQueryParams query,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(query);

        var q = dbContext.StockMovements.AsQueryable();

        // Filters

        if (query.ProductId.HasValue)
        {
            q = q.Where(m => m.ProductId == query.ProductId.Value);
        }

        if (query.WarehouseId.HasValue)
        {
            q = q.Where(m =>
                m.SourceWarehouseId == query.WarehouseId.Value ||
                m.DestinationWarehouseId == query.WarehouseId.Value);
        }

        if (query.Type.HasValue)
        {
            q = q.Where(m => m.MovementType == query.Type.Value);
        }

        if (query.FromDate.HasValue)
        {
            q = q.Where(m => m.CreatedAt >= query.FromDate.Value);
        }

        if (query.ToDate.HasValue)
        {
            q = q.Where(m => m.CreatedAt <= query.ToDate.Value);
        }

        // Count (reuses the same filtered IQueryable — no duplication)

        var totalCount = await q.CountAsync(cancellationToken);

        // Projection
        // All joins happen inside the database. Navigation property accesses
        // on nullable FK columns are guarded with null-conditional operators
        // so EF generates a LEFT JOIN rather than an INNER JOIN.

        var items = await q
            .OrderByDescending(m => m.CreatedAt)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(m => new StockMovementDto
            {
                Id = m.Id,
                MovementType = m.MovementType.ToString(),
                Status = m.Status.ToString(),
                Quantity = m.Quantity,

                ProductId = m.ProductId,
                ProductName = m.Product.Name,
                ProductSku = m.Product.SKU,

                SourceWarehouseId = m.SourceWarehouseId,
                SourceWarehouseName = m.SourceWarehouse != null ? m.SourceWarehouse.Name : null,
                DestinationWarehouseId = m.DestinationWarehouseId,
                DestinationWarehouseName = m.DestinationWarehouse != null ? m.DestinationWarehouse.Name : null,

                StockLocationId = m.StockLocationId,
                StockLocationLabel = m.StockLocation != null
                    ? m.StockLocation.Zone + " / " + m.StockLocation.Aisle + " / " + m.StockLocation.Shelf
                    : null,

                PerformedBy = m.UserId,
                PerformedByName = m.User.FirstName + " " + m.User.LastName,
                PerformedAt = m.CreatedAt,

                ReasonCode = m.ReasonCode,
                ReferenceNumber = m.ReferenceNumber,
                Notes = m.Notes,

                CountedQuantity = m.CountedQuantity,
                ReviewedByUserId = m.ReviewedByUserId,
                ReviewedByName = m.ReviewedByUser != null
                    ? m.ReviewedByUser.FirstName + " " + m.ReviewedByUser.LastName
                    : null,
                ReviewedAt = m.ReviewedAt,
            })
            .ToListAsync(cancellationToken);

        return PagedResult<StockMovementDto>.Create(items: items,
        page: query.Page,
        pageSize: query.PageSize,
        totalCount: totalCount);
    }
}
