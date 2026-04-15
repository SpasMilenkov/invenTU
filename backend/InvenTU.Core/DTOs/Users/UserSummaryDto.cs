namespace InvenTU.Core.DTOs.Users;

public sealed record UserSummaryDto(
    Guid Id,
    string FirstName,
    string LastName,
    string Email,
    IList<string> Roles,
    bool IsActive);
