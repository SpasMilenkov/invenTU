namespace InvenTU.Core.DTOs.Users;

public sealed record CreateUserRequest(
    string FirstName,
    string LastName,
    string Email,
    string Password,
    string Role);
