using System;
using System.Collections.Generic;
using System.Text;
using InvenTU.Core.DTOs.Categories;

namespace InvenTU.Core.Contracts.Services;

public interface ICategoryService
{
    Task<CategoryDTO> CreateCategoryAsync(CreateCategoryRequest createCategoryRequest, CancellationToken cancellationToken);
    Task DeleteCategoryAsync(Guid id, CancellationToken cancellationToken);
    Task UpdateCategoryAsync(Guid id, UpdateCategoryRequest updateCategoryRequest, CancellationToken cancellationToken);
    Task<CategoryDTO> GetAllCategoriesAsync(CancellationToken cancellationToken);
}
