using System;
using System.Collections.Generic;
using System.Text;
using InvenTU.Core.DTOs.Categories;
using InvenTU.Core.Entities;

namespace InvenTU.Core.Contracts.Repositories;

public interface ICategoryRepository
{
    Task<CategoryDTO> CreateCategoryAsync(Category category, CancellationToken cancellationToken = default);
    Task DeleteCategoryAsync(Guid id, CancellationToken cancellationToken = default);
    Task UpdateCategoryAsync(Category category, CancellationToken cancellationToken = default);
    Task<Category?> GetCategoryForUpdateAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<CategoryDTO>> GetAllCategoriesAsync(CancellationToken cancellationToken = default);
    Task<bool> ProductsExistForCategoryAsync(Guid categoryId, CancellationToken cancellationToken = default);
}
