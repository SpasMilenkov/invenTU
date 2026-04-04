using System;
using System.Collections.Generic;
using System.Text;
using InvenTU.Application.Auth;
using InvenTU.Application.DTOs;
using InvenTU.Core.Entities;
using Microsoft.AspNetCore.Identity;

namespace InvenTU.Infrastructure.Auth;

public class AuthService : IAuthService
{
    private ITokenService _tokenService;
    private UserManager<User> _userManager;

    public AuthService(ITokenService tokenService, UserManager<User> userManager)
    {
        _tokenService = tokenService;
        _userManager = userManager;
    }
    public async Task<string> LoginAsync(LoginDTO loginDto)
    {
        string token="";

        var user = await _userManager.FindByEmailAsync(loginDto.Email);

        if (user != null && await _userManager.CheckPasswordAsync(user, loginDto.Password))
        {
            var roles = await _userManager.GetRolesAsync(user);
            token = _tokenService.GenerateAccessToken(user, roles);
            await _tokenService.CreateRefreshTokenAsync(user.Id);
        }

        return token;
    }
    public async Task RegisterAsync(RegisterDTO registerDto)
    {
        var newUser = new User {
            Email = registerDto.Email,
            FirstName = registerDto.FirstName,
            LastName = registerDto.LastName
        };

        var result = await _userManager.CreateAsync(newUser);

        // Give user the default Worker role
        if (result.Succeeded)
        {
            await _userManager.AddToRoleAsync(newUser, "Worker");
        }

    }
}
