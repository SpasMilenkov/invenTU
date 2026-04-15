using InvenTU.Core.DTOs.Users;
using InvenTU.Core.Entities;

namespace InvenTU.Core.Extensions;

public static class UserMappingExtensions
{
    public static User ToEntity(this CreateUserRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        return new User
        {
            UserName = request.FirstName + request.LastName,
            Email = request.Email,
            FirstName = request.FirstName,
            LastName = request.LastName,
            IsActive = true,
        };
    }

    public static UserDetailDto ToDetailDto(this User user, IList<string> roles)
    {
        ArgumentNullException.ThrowIfNull(user);

        return new UserDetailDto(
            user.Id,
            user.FirstName,
            user.LastName,
            user.UserName ?? string.Empty,
            user.Email ?? string.Empty,
            roles,
            user.IsActive);
    }

    public static UserSummaryDto ToSummaryDto(this User user, IList<string> roles)
    {
        ArgumentNullException.ThrowIfNull(user);

        return new UserSummaryDto(
            user.Id,
            user.FirstName,
            user.LastName,
            user.Email ?? string.Empty,
            roles,
            user.IsActive);
    }
}
