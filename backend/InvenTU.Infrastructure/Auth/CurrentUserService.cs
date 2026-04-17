using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using InvenTU.Application.Auth;
using InvenTU.Core.DTOs.Auth;
using InvenTU.Core.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;

namespace InvenTU.Infrastructure.Auth;

public sealed class CurrentUserService (IHttpContextAccessor httpContextAccessor, UserManager<User> userManager) :ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor = httpContextAccessor;
    private readonly UserManager<User> _userManager = userManager;
    public async Task<CurrentUserDTO> GetCurrentUserAsync()
    {
        var userId = _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId == null)
            return null;

        var user = await _userManager.FindByIdAsync(userId) ?? throw new InvalidDataException();

        var currentUser = new CurrentUserDTO
        {
            UserId = Guid.Parse(userId),
            UserName = user?.UserName,
            Email = user?.Email,
            FirstName = user?.FirstName,
            LastName = user?.LastName,
            Roles = await _userManager.GetRolesAsync(user!)
        };

        return currentUser;
    }
}
