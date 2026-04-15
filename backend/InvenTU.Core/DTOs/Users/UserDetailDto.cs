namespace InvenTU.Core.DTOs.Users;

public sealed record UserDetailDto(
    Guid Id,
    string FirstName,
    string LastName,
    string UserName,
    string Email,
    IList<string> Roles,
    bool IsActive);
