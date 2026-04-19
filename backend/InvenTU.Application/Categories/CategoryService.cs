using System;
using System.Collections.Generic;
using System.Text;
using InvenTU.Core.Contracts.Repositories;
using InvenTU.Core.Contracts.Services;
using InvenTU.Core.DTOs.Categories;

namespace InvenTU.Application.Categories;

public sealed class CategoryService (ICategoryRepository categoryRepository) : ICategoryService
{
    private readonly ICategoryRepository _categoryRepository = categoryRepository;
    public Task CreateCategoryAsync(CategoryDTO categoryDto) => throw new NotImplementedException();
    public Task DeleteCategoryAsync(string id) => throw new NotImplementedException();
    public Task EditCategoryAsync(CategoryDTO categoryDto) => throw new NotImplementedException();
    public Task<CategoryDTO> GetAllCategoriesAsync() => throw new NotImplementedException();
}
