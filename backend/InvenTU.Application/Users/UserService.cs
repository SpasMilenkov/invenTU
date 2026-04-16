using InvenTU.Core.Contracts.Repositories;
using InvenTU.Core.Contracts.Services;
using InvenTU.Core.DTOs.Common;
using InvenTU.Core.DTOs.Users;
using InvenTU.Core.Entities;
using InvenTU.Core.Extensions;
using Microsoft.AspNetCore.Identity;

namespace InvenTU.Application.Users;

public sealed class UserService(
    IUserRepository userRepository,
    UserManager<User> userManager,
    RoleManager<IdentityRole<Guid>> roleManager) : IUserService
{
    public Task<PagedResult<UserSummaryDto>> GetUsersAsync(int page, int pageSize, CancellationToken cancellationToken = default)
        => userRepository.GetPagedAsync(page, pageSize, cancellationToken);

    public Task<UserDetailDto?> GetUserByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => userRepository.GetByIdAsync(id, cancellationToken);

    public async Task<(IdentityResult Result, UserDetailDto? User)> CreateUserAsync(CreateUserRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request, nameof(request));
        if (!await roleManager.RoleExistsAsync(request.Role))
        {
            return (IdentityResult.Failed(new IdentityError { Code = "InvalidRole", Description = $"Role '{request.Role}' does not exist." }), null);
        }

        var user = request.ToEntity();

        var result = await userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            return (result, null);
        }

        var roleResult = await userManager.AddToRoleAsync(user, request.Role);
        if (!roleResult.Succeeded)
        {
            await userManager.DeleteAsync(user);
            return (roleResult, null);
        }

        var roles = await userManager.GetRolesAsync(user);
        return (IdentityResult.Success, user.ToDetailDto(roles));
    }

    public async Task<(IdentityResult Result, UserDetailDto? User, bool Forbidden)> UpdateUserAsync(
        Guid targetUserId,
        UpdateUserRequest request,
        bool callerIsAdmin,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request, nameof(request));
        var user = await userRepository.GetForUpdateAsync(targetUserId, cancellationToken);
        if (user is null)
        {
            return (IdentityResult.Failed(new IdentityError { Code = "UserNotFound", Description = "User not found." }), null, false);
        }

        // Role change requires Admin
        if (request.Role is not null && !callerIsAdmin)
        {
            return (IdentityResult.Failed(new IdentityError { Code = "Forbidden", Description = "Only Admins may change roles." }), null, true);
        }

        if (request.FirstName is not null)
        {
            user.FirstName = request.FirstName;
        }

        if (request.LastName is not null)
        {
            user.LastName = request.LastName;
        }

        if (request.NewPassword is not null)
        {
            if (string.IsNullOrWhiteSpace(request.CurrentPassword))
            {
                return (IdentityResult.Failed(new IdentityError { Code = "PasswordRequired", Description = "Current password is required to set a new password." }), null, false);
            }

            var passwordResult = await userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
            if (!passwordResult.Succeeded)
            {
                return (passwordResult, null, false);
            }
        }

        var updateResult = await userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            return (updateResult, null, false);
        }

        if (request.Role is not null)
        {
            if (!await roleManager.RoleExistsAsync(request.Role))
            {
                return (IdentityResult.Failed(new IdentityError { Code = "InvalidRole", Description = $"Role '{request.Role}' does not exist." }), null, false);
            }

            var currentRoles = await userManager.GetRolesAsync(user);
            await userManager.RemoveFromRolesAsync(user, currentRoles);
            var roleResult = await userManager.AddToRoleAsync(user, request.Role);
            if (!roleResult.Succeeded)
            {
                return (roleResult, null, false);
            }
        }

        var updatedRoles = await userManager.GetRolesAsync(user);
        return (IdentityResult.Success, user.ToDetailDto(updatedRoles), false);
    }

    public async Task<IdentityResult> DeactivateUserAsync(Guid targetUserId, CancellationToken cancellationToken = default)
    {
        var user = await userRepository.GetForUpdateAsync(targetUserId, cancellationToken);
        if (user is null)
        {
            return IdentityResult.Failed(new IdentityError { Code = "UserNotFound", Description = "User not found." });
        }

        await userRepository.SetIsActiveAsync(user, false, cancellationToken);
        return IdentityResult.Success;
    }
}
