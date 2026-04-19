using System;
using System.Collections.Generic;
using System.Text;
using InvenTU.Core.DTOs.Categories;

namespace InvenTU.Core.Contracts.Services;

public interface ICategoryService
{
    Task CreateCategoryAsync(CategoryDTO categoryDto);
    Task DeleteCategoryAsync(string id);
    Task EditCategoryAsync(CategoryDTO categoryDto);
    Task<CategoryDTO> GetAllCategoriesAsync();
}
