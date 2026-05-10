using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace InvenTU.Api.Hubs;

/// <summary>
/// Hub endpoint: /hubs/stock
///
/// Clients join a group to filter by warehouse:
///   - "warehouse:all"  — every movement regardless of warehouse (default for dashboard)
///   - "warehouse:{id}" — movements that touch a specific warehouse ID
///
/// JWT auth is required. The bearer token must be passed either via the
/// standard Authorization header or the "access_token" query string parameter
/// (SignalR WebSocket transport cannot set headers on the upgrade request,
///  so the query string fallback is necessary).
/// </summary>
[Authorize]
public sealed class StockHub : Hub<IStockClient>
{
    /// <summary>
    /// </summary>
    public async Task JoinWarehouse(string warehouseId)
        => await Groups.AddToGroupAsync(Context.ConnectionId, $"warehouse:{warehouseId}");
    /// <summary>
    /// </summary>
    public async Task LeaveWarehouse(string warehouseId)
        => await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"warehouse:{warehouseId}");
    /// <summary>
    /// </summary>
    public override async Task OnConnectedAsync()
    {
        // Every client automatically joins the catch-all group so the
        // dashboard feed works without an explicit JoinWarehouse call.
        await Groups.AddToGroupAsync(Context.ConnectionId, "warehouse:all");
        await base.OnConnectedAsync();
    }
}
