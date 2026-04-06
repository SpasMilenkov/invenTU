using System;
using System.Collections.Generic;
using System.Text;
using InvenTU.Application.DTOs;
using Microsoft.AspNetCore.Identity;

namespace InvenTU.Application.Auth;

public interface IAuthService
{
    Task<LoginResultDTO> LoginAsync(LoginDTO loginDto);
    Task<IdentityResult> RegisterAsync(RegisterDTO registerDto);
}
