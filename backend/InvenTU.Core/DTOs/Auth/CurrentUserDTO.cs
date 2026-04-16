using System;
using System.Collections.Generic;
using System.Text;

namespace InvenTU.Core.DTOs;

public class CurrentUserDTO
{
    public Guid UserId { get; set; }
    public string? UserName { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Email { get; set; }
    public IList<string>? Roles { get; set; }
}
