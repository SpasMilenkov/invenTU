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
    public async Task<LoginResultDTO> LoginAsync(LoginDTO loginDto)
    {
        var result = new LoginResultDTO();

        var user = await _userManager.FindByEmailAsync(loginDto.Email);

        if (user != null && await _userManager.CheckPasswordAsync(user, loginDto.Password))
        {
            var roles = await _userManager.GetRolesAsync(user);
            result.AccessToken = _tokenService.GenerateAccessToken(user, roles);
            result.RefreshToken = await _tokenService.CreateRefreshTokenAsync(user.Id);
        }

        return result;
    }
    public async Task<IdentityResult> RegisterAsync(RegisterDTO registerDto)
    {
        var newUser = new User {
            UserName = registerDto.FirstName + registerDto.LastName,
            Email = registerDto.Email,
            FirstName = registerDto.FirstName,
            LastName = registerDto.LastName,
        };

        var result = await _userManager.CreateAsync(newUser, registerDto.Password??="");

        // Give user the default Worker role
        if (result.Succeeded)
            await _userManager.AddToRoleAsync(newUser, "Worker");

        return result;
    }
}
