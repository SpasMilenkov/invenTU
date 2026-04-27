using InvenTU.Api.Hubs;
using InvenTU.Core.Contracts.Services;
using InvenTU.Core.DTOs.Alerts;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace InvenTU.Api.Services;
///<summary>
/// </summary>
public sealed class SignalRAlertNotificationService(
    IHubContext<AlertHub, IAlertClient> hubContext,
    ILogger<SignalRAlertNotificationService> logger) : IAlertNotificationService
{
    ///<summary>
    /// </summary>
    public async Task NotifyUsersAsync(
        AlertLiveDto alert,
        IEnumerable<Guid> userIds,
        CancellationToken cancellationToken = default)
    {
        foreach (var userId in userIds)
        {
            try
            {
                // Clients.User() matches against the NameIdentifier claim.
                // SignalR fans out to all connections for that user automatically,
                // so multi-tab / multi-device scenarios work for free.
                await hubContext.Clients
                    .User(userId.ToString())
                    .ReceiveAlert(alert);
            }
            catch (Exception ex)
            {
                // Never let a failed push break the alert creation transaction.
                logger.LogWarning(ex,
                    "SignalR alert push failed for user {UserId}, alert {AlertId}",
                    userId, alert.AlertId);
            }
        }
    }
}
