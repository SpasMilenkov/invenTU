using System;
using System.Collections.Generic;
using System.Text;

namespace InvenTU.Application.DTOs;

public class CurrentUserDTO
{
    public Guid UserId { get; set; }
    public IList<string>? Roles { get; set; }
}
