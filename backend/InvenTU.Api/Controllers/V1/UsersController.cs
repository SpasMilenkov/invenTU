using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using InvenTU.Core.Contracts.Services;
using InvenTU.Core.DTOs.Users;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InvenTU.Api.Controllers.V1;

/// <summary>
/// Controller for managing users. All endpoints require authentication.
/// Admins have full access; Managers can view all users but not create/update/delete; Users can view and update their own profile only.
/// </summary>
[Route("api/v1/users")]
[ApiController]
[Authorize]
public sealed class UsersController(IUserService userService) : ControllerBase
{
    /// <summary>
    /// Returns a paginated list of all users. Accessible by Admin and Manager roles only.
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> GetUsers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        if (page < 1)
        {
            page = 1;
        }

        if (pageSize < 1)
        {
            pageSize = 1;
        }

        if (pageSize > 100)
        {
            pageSize = 100;
        }

        var result = await userService.GetUsersAsync(page, pageSize, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Returns a single user by id. Admins and Managers may fetch any user; others may only fetch their own profile.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetUser(Guid id, CancellationToken cancellationToken = default)
    {
        var callerIsPrivileged = User.IsInRole("Admin") || User.IsInRole("Manager");
        var callerId = User.FindFirstValue(JwtRegisteredClaimNames.Sub);

        if (!callerIsPrivileged && callerId != id.ToString())
        {
            return Forbid();
        }

        var user = await userService.GetUserByIdAsync(id, cancellationToken);
        return user is null ? NotFound() : Ok(user);
    }

    /// <summary>
    /// Creates a new user with the specified role. Admin only.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request, CancellationToken cancellationToken = default)
    {
        var (result, user) = await userService.CreateUserAsync(request, cancellationToken);

        if (!result.Succeeded)
        {
            return BadRequest(result.Errors);
        }

        return CreatedAtAction(nameof(GetUser), new { id = user!.Id }, user);
    }

    /// <summary>
    /// Updates a user's profile. Users may update their own name and password.
    /// Only Admins may change roles. Admins may update any user.
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateUser(Guid id, [FromBody] UpdateUserRequest request, CancellationToken cancellationToken = default)
    {
        var callerIsAdmin = User.IsInRole("Admin");
        var callerId = User.FindFirstValue(JwtRegisteredClaimNames.Sub);

        // Non-admin may only edit their own profile
        if (!callerIsAdmin && callerId != id.ToString())
        {
            return Forbid();
        }

        var (result, user, forbidden) = await userService.UpdateUserAsync(id, request, callerIsAdmin, cancellationToken);

        if (forbidden)
        {
            return Forbid();
        }

        if (!result.Succeeded)
        {
            if (result.Errors.Any(e => e.Code == "UserNotFound"))
            {
                return NotFound();
            }

            return BadRequest(result.Errors);
        }

        return Ok(user);
    }

    /// <summary>
    /// Soft-deletes (deactivates) a user. Admin only.
    /// </summary>
    [HttpPatch("{id:guid}/deactivate")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeactivateUser(Guid id, CancellationToken cancellationToken = default)
    {
        var result = await userService.DeactivateUserAsync(id, cancellationToken);

        if (!result.Succeeded)
        {
            if (result.Errors.Any(e => e.Code == "UserNotFound"))
            {
                return NotFound();
            }

            return BadRequest(result.Errors);
        }

        return NoContent();
    }
}
