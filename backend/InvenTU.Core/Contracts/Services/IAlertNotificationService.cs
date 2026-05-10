using InvenTU.Core.DTOs.Alerts;

namespace InvenTU.Core.Contracts.Services;

/// <summary>
/// Pushes real-time alert notifications to specific users over SignalR.
/// Implemented in the API layer; no-op stub usable in tests.
///
/// Unlike ILiveFeedService (which broadcasts to groups), this targets
/// individual users because each AlertUserState belongs to one user.
/// </summary>
public interface IAlertNotificationService
{
    /// <summary>
    /// Sends the alert to each user in <paramref name="userIds"/>.
    /// Fire-and-forget — failures are logged but never bubble to the caller.
    /// </summary>
    Task NotifyUsersAsync(
        AlertLiveDto alert,
        IEnumerable<Guid> userIds,
        CancellationToken cancellationToken = default);
}
