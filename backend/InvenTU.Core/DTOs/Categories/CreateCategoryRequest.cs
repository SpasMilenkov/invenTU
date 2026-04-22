using System;
using System.Collections.Generic;
using System.Text;

namespace InvenTU.Core.DTOs.Categories;

public sealed class CreateCategoryRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? ParentCategoryId { get; set; }
}
