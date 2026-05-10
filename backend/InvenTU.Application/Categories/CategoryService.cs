using FluentValidation;
using InvenTU.Core.Contracts.Repositories;
using InvenTU.Core.Contracts.Services;
using InvenTU.Core.DTOs.Categories;
using InvenTU.Core.Entities;
using InvenTU.Core.Exceptions;
using ValidationException = InvenTU.Core.Exceptions.ValidationException;

namespace InvenTU.Application.Categories;

public sealed class CategoryService (ICategoryRepository categoryRepository,
                                    IValidator<CreateCategoryRequest> createCategoryRequestValidator,
                                    IValidator<UpdateCategoryRequest> updateCategoryRequestValidator) : ICategoryService
{
    private readonly ICategoryRepository _categoryRepository = categoryRepository;
    public async Task<CategoryDTO> CreateCategoryAsync(CreateCategoryRequest createCategoryRequest, CancellationToken cancellationToken)
    {
        var validationResult = createCategoryRequestValidator.Validate(createCategoryRequest);

        if (!validationResult.IsValid)
        {
            // Reformats the Validation error to throw a descriptive Exception
            var errorDictionary = validationResult.Errors.GroupBy(e => e.PropertyName)
                                    .ToDictionary(p => p.Key,
                                        p => p.Select(p => p.ErrorMessage).ToArray()
                                    );

            throw new ValidationException(errorDictionary);
        }

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
        if (await _categoryRepository.ProductsExistForCategoryAsync(id, cancellationToken))
            throw new CategoryHasProductsException();

        await _categoryRepository.DeleteCategoryAsync(id, cancellationToken);
    }
    public async Task UpdateCategoryAsync(Guid id, UpdateCategoryRequest updateCategoryRequest, CancellationToken cancellationToken)
    {
        var validationResult = updateCategoryRequestValidator.Validate(updateCategoryRequest);

        if (!validationResult.IsValid)
        {
            // Reformats the Validation error to throw a descriptive Exception
            var errorDictionary = validationResult.Errors.GroupBy(e => e.PropertyName)
                                    .ToDictionary(p => p.Key,
                                        p => p.Select(p => p.ErrorMessage).ToArray()
                                    );

            throw new ValidationException(errorDictionary);
        }

        var categoryForUpdate = await _categoryRepository.GetCategoryForUpdateAsync(id, cancellationToken) ?? throw new InvalidOperationException();

        categoryForUpdate.Name = updateCategoryRequest.Name;
        categoryForUpdate.Description = updateCategoryRequest.Description;
        categoryForUpdate.ParentCategoryId = updateCategoryRequest.ParentCategoryId;

        await _categoryRepository.UpdateCategoryAsync(categoryForUpdate);
    }
    public async Task<IReadOnlyList<CategoryDTO>> GetAllCategoriesAsync(CancellationToken cancellationToken)
    {
        return await _categoryRepository.GetAllCategoriesAsync(cancellationToken);
    }
}
