using InvenTU.Core.DTOs.Auth;

namespace InvenTU.Application.Auth;

public interface ICurrentUserService
{
    Task<CurrentUserDTO> GetCurrentUserAsync();
}
