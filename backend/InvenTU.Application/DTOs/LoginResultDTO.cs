using System;
using System.Collections.Generic;
using System.Text;

namespace InvenTU.Application.DTOs;

public class LoginResultDTO
{
    public Guid Id { get; set; }
    public string? UserName { get; set; }
    public string? Email { get; set; }
    public IList<string>? Roles { get; set; }
    public string? AccessToken { get; set; }
    public string? RefreshToken { get; set; }
}
