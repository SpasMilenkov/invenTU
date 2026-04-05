using FluentValidation;
using InvenTU.Application.Auth;
using InvenTU.Application.DTOs;
using Microsoft.AspNetCore.Mvc;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace InvenTU.Api.Controllers.Auth;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private IAuthService _authService;
    private IValidator<RegisterDTO> _registerDtoValidator;
    public AuthController(IAuthService authService, IValidator<RegisterDTO> registerDtoValidator)
    {
        _authService = authService;
        _registerDtoValidator = registerDtoValidator;
    }
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDTO loginDto)
    {
        var token = await _authService.LoginAsync(loginDto);

        if (token == "")
            return Unauthorized();
        return Ok(token);
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDTO registerDto)
    {
        var validationResult = _registerDtoValidator.Validate(registerDto);

        if (!validationResult.IsValid)
        {
            return BadRequest(validationResult.Errors);
        }

        await _authService.RegisterAsync(registerDto);

        return Created();
    }
}
