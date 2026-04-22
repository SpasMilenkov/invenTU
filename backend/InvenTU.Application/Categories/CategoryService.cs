using System;
using System.Collections.Generic;
using System.Text;
using InvenTU.Core.Contracts.Repositories;
using InvenTU.Core.Contracts.Services;
using InvenTU.Core.DTOs.Categories;
using InvenTU.Core.Entities;

namespace InvenTU.Application.Categories;

public sealed class CategoryService (ICategoryRepository categoryRepository) : ICategoryService
{
    private readonly ICategoryRepository _categoryRepository = categoryRepository;
    public async Task<CategoryDTO> CreateCategoryAsync(CreateCategoryRequest createCategoryRequest, CancellationToken cancellationToken)
    {
        var category = new Category
        {
            Name = createCategoryRequest.Name,
            Description = createCategoryRequest.Description,
            ParentCategoryId = createCategoryRequest.ParentCategoryId,

        };

        return await _categoryRepository.CreateCategoryAsync(category);
    }
    public async Task DeleteCategoryAsync(Guid id, CancellationToken cancellationToken)
    {
        await _categoryRepository.DeleteCategoryAsync(id, cancellationToken);
    }
    public async Task UpdateCategoryAsync(Guid id, UpdateCategoryRequest updateCategoryRequest, CancellationToken cancellationToken)
    {
        var categoryForUpdate = await _categoryRepository.GetCategoryForUpdateAsync(id, cancellationToken) ?? throw new InvalidOperationException();

        categoryForUpdate.Name = updateCategoryRequest.Name;
        categoryForUpdate.Description = updateCategoryRequest.Description;
        categoryForUpdate.ParentCategoryId = updateCategoryRequest.ParentCategoryId;


        await _categoryRepository.UpdateCategoryAsync(categoryForUpdate);
    }
    public async Task<CategoryDTO> GetAllCategoriesAsync(CancellationToken cancellationToken)
    {
        return await GetAllCategoriesAsync(cancellationToken);
    }
}
