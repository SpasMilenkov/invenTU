using System.Linq.Expressions;
using InvenTU.Core.DTOs.Users;
using InvenTU.Core.Entities;
using Microsoft.AspNetCore.Identity;

namespace InvenTU.Infrastructure.Projections;

internal static class UserProjections
{
    internal static Expression<Func<User, UserSummaryDto>> ToSummaryDto(
        IQueryable<IdentityUserRole<Guid>> userRoles,
        IQueryable<IdentityRole<Guid>> roles)
        => u => new UserSummaryDto(
            u.Id,
            u.FirstName,
            u.LastName,
            u.Email ?? string.Empty,
            userRoles
                .Where(ur => ur.UserId == u.Id)
                .Join(roles, ur => ur.RoleId, r => r.Id, (ur, r) => r.Name!)
                .ToList(),
            u.IsActive);

    internal static Expression<Func<User, UserDetailDto>> ToDetailDto(
        IQueryable<IdentityUserRole<Guid>> userRoles,
        IQueryable<IdentityRole<Guid>> roles)
        => u => new UserDetailDto(
            u.Id,
            u.FirstName,
            u.LastName,
            u.UserName ?? string.Empty,
            u.Email ?? string.Empty,
            userRoles
                .Where(ur => ur.UserId == u.Id)
                .Join(roles, ur => ur.RoleId, r => r.Id, (ur, r) => r.Name!)
                .ToList(),
            u.IsActive);
}
