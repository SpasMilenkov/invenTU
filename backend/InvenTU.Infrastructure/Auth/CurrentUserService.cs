using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using InvenTU.Application.Auth;
using InvenTU.Application.DTOs;
using InvenTU.Core.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;

namespace InvenTU.Infrastructure.Auth;

public sealed class CurrentUserService (IHttpContextAccessor httpContextAccessor) :ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor = httpContextAccessor;
    public CurrentUserDTO GetCurrentUserAsync()
    {
        var currentUser = new CurrentUserDTO();

        var userId = _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId == null)
            return null;

        currentUser.UserId = Guid.Parse(userId!);
        currentUser.Roles = _httpContextAccessor.HttpContext?.User.FindAll(ClaimTypes.Role).Select(c=>c.Value).ToList();

        return currentUser;
    }
}
