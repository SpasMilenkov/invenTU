using System.Linq.Expressions;
using InvenTU.Core.DTOs.Categories;
using InvenTU.Core.Entities;

namespace InvenTU.Infrastructure.Projections;

internal static class CategoryProjections
{
    internal static Expression<Func<Category, CategoryDTO>> ToDTO() => c => new CategoryDTO
    {
        Id = c.Id,
        Name = c.Name,
        Description = c.Description,
        ParentCategoryId = c.ParentCategoryId,
        SubCategories = c.SubCategories.AsQueryable().Select(ToDTO()).ToList(),
        Products = c.Products.AsQueryable().Select(ProductProjections.ToDto).ToList()
    };
}
