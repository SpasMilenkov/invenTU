using InvenTU.Core.Contracts.Repositories;
using InvenTU.Core.DTOs.Common;
using InvenTU.Core.DTOs.Users;
using InvenTU.Core.Entities;
using InvenTU.Infrastructure.Data;
using InvenTU.Infrastructure.Projections;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace InvenTU.Infrastructure.Repositories;

public sealed class UserRepository(UserManager<User> userManager, InvenTUDbContext dbContext) : IUserRepository
{
    public async Task<PagedResult<UserSummaryDto>> GetPagedAsync(int page, int pageSize, CancellationToken cancellationToken = default)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(page, nameof(page));
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(pageSize, nameof(pageSize));

        var query = dbContext.Users.AsNoTracking();

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderBy(u => u.LastName)
            .ThenBy(u => u.FirstName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(UserProjections.ToSummaryDto(dbContext.UserRoles, dbContext.Roles))
            .ToListAsync(cancellationToken);

        return PagedResult<UserSummaryDto>.Create(items, page, pageSize, totalCount);
    }

    public Task<UserDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => dbContext.Users
            .AsNoTracking()
            .Where(u => u.Id == id)
            .Select(UserProjections.ToDetailDto(dbContext.UserRoles, dbContext.Roles))
            .FirstOrDefaultAsync(cancellationToken);

    public Task<User?> GetForUpdateAsync(Guid id, CancellationToken cancellationToken = default)
        => dbContext.Users.FirstOrDefaultAsync(u => u.Id == id, cancellationToken);

    public async Task SetIsActiveAsync(User user, bool isActive, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(user, nameof(user));
        user.IsActive = isActive;
        await userManager.UpdateAsync(user);
    }

    public async Task<IReadOnlyList<Guid>> GetUserIdsByRoleAsync(
        string roleName,
        CancellationToken cancellationToken = default)
    {
        var normalizedRole = roleName?.ToUpperInvariant();
    
        return await (
            from u in dbContext.Users
            join ur in dbContext.UserRoles on u.Id equals ur.UserId
            join r in dbContext.Roles on ur.RoleId equals r.Id
            where u.IsActive && r.NormalizedName == normalizedRole
            select u.Id
        ).ToListAsync(cancellationToken);
    }
}
