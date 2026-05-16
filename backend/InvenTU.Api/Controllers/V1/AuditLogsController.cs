using InvenTU.Core.Contracts.Services;
using InvenTU.Core.DTOs.AuditLogs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InvenTU.Api.Controllers.V1;

/// <summary>
/// Read-only access to the audit trail.
/// The audit table is populated by the EF Core SaveChanges interceptor; no
/// mutation endpoints exist.
/// </summary>
[ApiController]
[Route("api/v1/audit-logs")]
[Authorize(Roles = "Admin")]
public sealed class AuditLogsController(IAuditLogService auditLogService) : ControllerBase
{
    /// <summary>Returns a paginated, filtered list of audit entries.</summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Get(
        [FromQuery] AuditLogQueryParams query,
        CancellationToken cancellationToken)
    {
        var result = await auditLogService.GetPagedAsync(query, cancellationToken);
        return Ok(result);
    }
}
