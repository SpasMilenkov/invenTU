using System;
using System.Collections.Generic;
using System.Text;
using InvenTU.Application.DTOs;

namespace InvenTU.Application.Auth;

public interface ICurrentUserService
{
    Task<CurrentUserDTO> GetCurrentUserAsync();
}
