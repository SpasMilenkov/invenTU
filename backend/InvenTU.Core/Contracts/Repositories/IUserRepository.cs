using InvenTU.Core.DTOs.Common;
using InvenTU.Core.DTOs.Users;
using InvenTU.Core.Entities;

namespace InvenTU.Core.Contracts.Repositories;

public interface IUserRepository
{
    Task<PagedResult<UserSummaryDto>> GetPagedAsync(int page, int pageSize, CancellationToken cancellationToken = default);
    Task<UserDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<User?> GetForUpdateAsync(Guid id, CancellationToken cancellationToken = default);
    Task SetIsActiveAsync(User user, bool isActive, CancellationToken cancellationToken = default);
}
