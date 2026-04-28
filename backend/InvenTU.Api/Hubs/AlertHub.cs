using InvenTU.Core.DTOs.Alerts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace InvenTU.Api.Hubs;
/// <summary>
/// Hub endpoint: /hubs/alerts
///
/// No groups needed — SignalR routes to individual users via the
/// NameIdentifier claim automatically when you call Clients.User(userId).
///
/// Clients connect once on login and stay connected for the session.
/// No explicit join/leave calls required from the frontend.
/// </summary>
[Authorize]
public sealed class AlertHub : Hub<IAlertClient>
{
    // Intentionally empty — delivery is handled server-side via IHubContext.
    // Add client-invokable methods here if you later need acknowledgement, etc.
}
