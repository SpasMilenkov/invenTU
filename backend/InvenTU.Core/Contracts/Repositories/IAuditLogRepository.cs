using InvenTU.Core.DTOs.AuditLogs;
using InvenTU.Core.DTOs.Common;

namespace InvenTU.Core.Contracts.Repositories;

public interface IAuditLogRepository
{
    Task<PagedResult<AuditLogDto>> GetPagedAsync(AuditLogQueryParams query, CancellationToken cancellationToken);
}
