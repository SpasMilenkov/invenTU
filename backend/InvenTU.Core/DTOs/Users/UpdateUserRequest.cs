namespace InvenTU.Core.DTOs.Users;

public sealed record UpdateUserRequest(
    string? FirstName,
    string? LastName,
    string? Role,
    string? CurrentPassword,
    string? NewPassword);
