using System;
using System.Collections.Generic;
using System.Text;

namespace InvenTU.Application.DTOs;

public class LoginResultDTO
{
    public string? AccessToken { get; set; }
    public string? RefreshToken { get; set; }
}
