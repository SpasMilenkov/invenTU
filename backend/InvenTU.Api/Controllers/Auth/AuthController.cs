using FluentValidation;
using InvenTU.Application.Auth;
using InvenTU.Application.DTOs;
using InvenTU.Infrastructure.Auth;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace InvenTU.Api.Controllers.Auth;

[Route("api/[controller]")]
[ApiController]
public class AuthController (IAuthService authService, IValidator<RegisterDTO> registerDtoValidator, ICurrentUserService currentUserService) : ControllerBase
{
    private readonly IAuthService _authService = authService;
    private readonly ICurrentUserService _currentUserService = currentUserService;
    private readonly IValidator<RegisterDTO> _registerDtoValidator = registerDtoValidator;
    /// <summary>
    /// Signs in as existing user
    /// </summary>
    /// <param name="loginDto">Form input used to sign in as existing user</param>
    /// <returns></returns>
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDTO loginDto)
    {
        var result = await _authService.LoginAsync(loginDto);

        if (result.AccessToken == null || result.RefreshToken == null)
            return Unauthorized();

        Response.Cookies.Append("refreshToken", result.RefreshToken);

        return Ok(new { result.Id,
                        result.UserName,
                        result.Email,
                        result.AccessToken,
                        result.Roles});
    }

    /// <summary>
    /// Registers a new user
    /// </summary>
    /// <param name="registerDto">Form input used to create a new user</param>
    /// <returns></returns>
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDTO registerDto)
    {
        var validationResult = _registerDtoValidator.Validate(registerDto);

        if (!validationResult.IsValid)
        {
            return BadRequest(validationResult.Errors);
        }

        var registerResult = await _authService.RegisterAsync(registerDto);
        if (!registerResult.Succeeded)
        {
            // Return 409 on duplicate email input 
            if (registerResult.Errors.Any(e=>e.Code == (new IdentityErrorDescriber()).DuplicateEmail(registerDto.Email!).Code))
                return Conflict(registerResult.Errors);
            return BadRequest(registerResult.Errors);
        }

        return Created();
    }
    [HttpGet("current")]
    public async Task<IActionResult> GetCurrentUser()
    {
        var currentUser = await _currentUserService.GetCurrentUserAsync();

        if (currentUser==null)
            return Unauthorized();

        return Ok(currentUser);
    }
}
