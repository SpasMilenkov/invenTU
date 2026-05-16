using InvenTU.Core.DTOs.AuditLogs;
using InvenTU.Core.DTOs.Common;

namespace InvenTU.Core.Contracts.Services;

public interface IAuditLogService
{
    Task<PagedResult<AuditLogDto>> GetPagedAsync(AuditLogQueryParams query, CancellationToken cancellationToken);
}
