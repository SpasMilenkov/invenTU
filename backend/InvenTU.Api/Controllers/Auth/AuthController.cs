using FluentValidation;
using InvenTU.Core.Contracts.Services;
using InvenTU.Core.DTOs.Auth;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace InvenTU.Api.Controllers.Auth;

// <summary>
/// Controller for handling authentication-related actions like login and registration. Endpoints are public.
// </summary>
[Route("api/[controller]")]
[ApiController]
public sealed class AuthController(IAuthService authService, IValidator<RegisterDTO> registerDtoValidator) : ControllerBase
{
    private static readonly CookieOptions RefreshTokenCookieOptions = new()
    {
        HttpOnly = true,
        Secure = true,
        SameSite = SameSiteMode.Strict,
        Path = "/",
        MaxAge = TimeSpan.FromDays(7),
    };

    /// <summary>
    /// Signs in as existing user
    /// </summary>
    /// <param name="loginDto">Form input used to sign in as existing user</param>
    /// <returns></returns>
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDTO loginDto)
    {
        var result = await authService.LoginAsync(loginDto);

        if (result.AccessToken == null || result.RefreshToken == null)
            return Unauthorized(new { message = result.ErrorMessage ?? "Invalid credentials" });

        Response.Cookies.Append("refreshToken", result.RefreshToken, RefreshTokenCookieOptions);

        return Ok(new
        {
            result.Id,
            result.UserName,
            result.Email,
            result.AccessToken,
            result.Roles
        });
    }

    /// <summary>
    /// Registers a new user
    /// </summary>
    /// <param name="registerDto">Form input used to create a new user</param>
    /// <returns></returns>
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDTO registerDto)
    {
        var validationResult = registerDtoValidator.Validate(registerDto);

        if (!validationResult.IsValid)
        {
            return BadRequest(validationResult.Errors);
        }

        var registerResult = await authService.RegisterAsync(registerDto);
        if (!registerResult.Succeeded)
        {
            // Return 409 on duplicate email input
            if (registerResult.Errors.Any(e => e.Code == (new IdentityErrorDescriber()).DuplicateEmail(registerDto.Email!).Code))
                return Conflict(registerResult.Errors);
            return BadRequest(registerResult.Errors);
        }

        return Created();
    }

    /// <summary>
    /// Issues a new access token using the refresh token cookie
    /// </summary>
    /// <returns></returns>
    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh()
    {
        var refreshToken = Request.Cookies["refreshToken"];

        if (string.IsNullOrEmpty(refreshToken))
            return Unauthorized(new { message = "Refresh token not found" });

        var result = await authService.RefreshAsync(refreshToken);

        if (result.AccessToken == null || result.RefreshToken == null)
            return Unauthorized(new { message = result.ErrorMessage ?? "Invalid or expired refresh token" });

        Response.Cookies.Append("refreshToken", result.RefreshToken, RefreshTokenCookieOptions);

        return Ok(new
        {
            result.Id,
            result.UserName,
            result.Email,
            result.AccessToken,
            result.Roles
        });
    }

    /// <summary>
    /// Revokes the refresh token and clears the cookie
    /// </summary>
    /// <returns></returns>
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var refreshToken = Request.Cookies["refreshToken"];

        if (!string.IsNullOrEmpty(refreshToken))
            await authService.LogoutAsync(refreshToken);

        Response.Cookies.Delete("refreshToken", new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Path = "/",
        });

        return NoContent();
    }
}
