// InvenTU.API/Controllers/AlertsController.cs
using System.Security.Claims;
using InvenTU.Core.Contracts.Services;
using InvenTU.Core.DTOs.Alerts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InvenTU.Api.Controllers.V1
{
    ///s
    [ApiController]
    [Route("api/v1/alerts")]
    [Authorize]
    public sealed class AlertsController(IAlertService alertService) : ControllerBase
    {
        private Guid CurrentUserId =>
            Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        /// <summary>Seeds the client on mount with the caller's most recent 100 alerts.</summary>
        [HttpGet("my")]
        [ProducesResponseType<IReadOnlyList<AlertLiveDto>>(200)]
        public async Task<IActionResult> GetMy(CancellationToken ct)
        {
            var alerts = await alertService.GetMyAlertsAsync(CurrentUserId, ct);
            return Ok(alerts);
        }

        /// <summary>Mark a single alert read. Mirrors the SignalR optimistic update with a durable write.</summary>
        [HttpPatch("{alertId:guid}/read")]
        [ProducesResponseType(204)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> MarkRead(Guid alertId, CancellationToken ct)
        {
            await alertService.MarkReadAsync(CurrentUserId, alertId, ct);
            return NoContent();
        }

        /// <summary>Mark every unread alert read in one shot.</summary>
        [HttpPatch("read-all")]
        [ProducesResponseType(204)]
        public async Task<IActionResult> MarkAllRead(CancellationToken ct)
        {
            await alertService.MarkAllReadAsync(CurrentUserId, ct);
            return NoContent();
        }
    }
}