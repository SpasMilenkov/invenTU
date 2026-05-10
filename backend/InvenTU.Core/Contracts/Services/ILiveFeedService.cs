using InvenTU.Core.DTOs.Stock;

namespace InvenTU.Core.Contracts.Services;

/// <summary>
/// Broadcasts real-time stock movement events to connected clients.
/// Implemented in the API layer using SignalR; no-op stub usable in tests.
/// </summary>
public interface ILiveFeedService
{
    /// <summary>
    /// Sends a movement event to the "warehouse:all" group and, if warehouse IDs
    /// are present, to the targeted warehouse group(s).
    /// Fire-and-forget — failures are logged but never bubble up to the caller.
    /// </summary>
    Task BroadcastMovementAsync(StockMovementLiveDto movement, CancellationToken cancellationToken = default);
}
