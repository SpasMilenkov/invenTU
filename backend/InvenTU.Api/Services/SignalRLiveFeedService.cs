using InvenTU.Api.Hubs;
using InvenTU.Core.Contracts.Services;
using InvenTU.Core.DTOs.Stock;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace InvenTU.Api.Services;

/// <summary>
/// Concrete implementation of ILiveFeedService that broadcasts over SignalR.
/// Registered as a scoped service in Program.cs and injected into Application services.
///
/// Broadcasting strategy:
///   1. Always send to "warehouse:all" (global dashboard).
///   2. If a DestinationWarehouseName is set, also send to that warehouse group.
///      We don't have the warehouse ID at broadcast time (services use names),
///      so the hub groups are keyed by name. If you later want per-ID groups,
///      add DestinationWarehouseId / SourceWarehouseId to StockMovementLiveDto.
/// </summary>
public sealed class SignalRLiveFeedService(
    IHubContext<StockHub, IStockClient> hubContext,
    ILogger<SignalRLiveFeedService> logger) : ILiveFeedService
{
    /// <summary>
    /// </summary>
    public async Task BroadcastMovementAsync(StockMovementLiveDto movement, CancellationToken cancellationToken = default)
    {
        try
        {
            // Always broadcast to the catch-all dashboard group.
            await hubContext.Clients
                .Group("warehouse:all")
                .ReceiveMovement(movement);
        }
        catch (Exception ex)
        {
            // Live feed failures must never take down a write operation.
            logger.LogWarning(ex,
                "SignalR broadcast failed for movement {MovementId} ({Type})",
                movement.MovementId, movement.MovementType);
        }
    }
}
