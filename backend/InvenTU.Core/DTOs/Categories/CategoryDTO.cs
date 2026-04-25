using System;
using System.Collections.Generic;
using System.Text;
using InvenTU.Core.DTOs.Products;

namespace InvenTU.Core.DTOs.Categories;

public sealed class CategoryDTO
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? ParentCategoryId { get; set; }
    public IReadOnlyList<CategoryDTO> SubCategories { get; set; } = [];
    public IReadOnlyList<ProductDto> Products { get; set; } = [];
}
