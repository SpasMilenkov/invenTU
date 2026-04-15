using InvenTU.Core.DTOs.Common;
using InvenTU.Core.DTOs.Users;
using Microsoft.AspNetCore.Identity;

namespace InvenTU.Core.Contracts.Services;

public interface IUserService
{
    Task<PagedResult<UserSummaryDto>> GetUsersAsync(int page, int pageSize, CancellationToken cancellationToken = default);
    Task<UserDetailDto?> GetUserByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<(IdentityResult Result, UserDetailDto? User)> CreateUserAsync(CreateUserRequest request, CancellationToken cancellationToken = default);
    Task<(IdentityResult Result, UserDetailDto? User, bool Forbidden)> UpdateUserAsync(Guid targetUserId, UpdateUserRequest request, bool callerIsAdmin, CancellationToken cancellationToken = default);
    Task<IdentityResult> DeactivateUserAsync(Guid targetUserId, CancellationToken cancellationToken = default);
}
