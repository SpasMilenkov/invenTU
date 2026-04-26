using System;
using System.Collections.Generic;
using System.Text;
using InvenTU.Core.Contracts.Repositories;
using InvenTU.Core.DTOs.Categories;
using InvenTU.Core.Entities;
using InvenTU.Infrastructure.Data;
using InvenTU.Infrastructure.Projections;
using Microsoft.EntityFrameworkCore;

namespace InvenTU.Infrastructure.Repositories;

public sealed class CategoryRepository(InvenTUDbContext dbContext) : ICategoryRepository
{
    private readonly InvenTUDbContext _dbContext = dbContext;

    public async Task DeleteCategoryAsync(Guid id, CancellationToken cancellationToken = default)
    {
        await _dbContext.Categories
                        .Where(c => c.Id == id && c.Products.Count == 0)
                        .ExecuteDeleteAsync(cancellationToken);
    }
    public async Task<IReadOnlyList<CategoryDTO>> GetAllCategoriesAsync(CancellationToken cancellationToken = default)
    {
        var allCategories = await _dbContext.Categories
                                .Select(CategoryProjections.ToDTO)
                                .AsNoTracking()
                                .ToDictionaryAsync(c=>c.Id, cancellationToken);

        foreach (var category in allCategories.Where(c => c.Value.ParentCategoryId is not null))
        {
            var parent = allCategories[category.Value.ParentCategoryId ?? Guid.Empty];
            ((List<CategoryDTO>)parent.SubCategories).Add(category.Value);
        }
        return allCategories.Values.AsQueryable().Where(c => c.ParentCategoryId == null).ToList();
    }

    public async Task<CategoryDTO> CreateCategoryAsync(Category category, CancellationToken cancellationToken = default)
    {
        var result = await _dbContext.AddAsync(category, cancellationToken) ?? throw new InvalidOperationException();

        await _dbContext.SaveChangesAsync(cancellationToken);

        return new CategoryDTO
        {
            Id = result.Entity.Id,
            Name = result.Entity.Name,
            Description = result.Entity.Description,
            ParentCategoryId = result.Entity.ParentCategoryId,
        };
    }
    public async Task UpdateCategoryAsync(Category category, CancellationToken cancellationToken = default)
    {
        var result = await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<Category?> GetCategoryForUpdateAsync(Guid id, CancellationToken cancellationToken)
    {
        return await _dbContext.Categories
                                .Where(c => c.Id == id)
                                .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<bool> ProductsExistForCategoryAsync(Guid categoryId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Products.AnyAsync(
            p => p.CategoryId == categoryId && p.DeletedAt == null,
            cancellationToken);
    }
}
