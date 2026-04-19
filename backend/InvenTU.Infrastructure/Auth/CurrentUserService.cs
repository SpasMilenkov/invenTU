using System.Security.Claims;
using InvenTU.Application.Auth;
using InvenTU.Core.DTOs.Auth;
using InvenTU.Core.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;

namespace InvenTU.Infrastructure.Auth;

public sealed class CurrentUserService(IHttpContextAccessor httpContextAccessor, UserManager<User> userManager) : ICurrentUserService
{
    public async Task<CurrentUserDTO?> GetCurrentUserAsync()
    {
        var userId = httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrEmpty(userId))
        {
            return null;
        }

        var user = await userManager.FindByIdAsync(userId);

        if (user is null)
        {
            return null;
        }

        var currentUser = new CurrentUserDTO
        {
            UserId = Guid.Parse(userId),
            UserName = user.UserName,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Roles = await userManager.GetRolesAsync(user)
        };

        return currentUser;
    }
}
