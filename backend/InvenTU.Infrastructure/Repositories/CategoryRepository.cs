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
                        .Where(c => c.Id == id)
                        .ExecuteDeleteAsync(cancellationToken);
    }
    public async Task<IReadOnlyList<CategoryDTO>> GetAllCategoriesAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.Categories
                        .Include(c => c.SubCategories)
                        .Include(c => c.Products)
                        .Select(CategoryProjections.ToDTO())
                        .AsNoTracking()
                        .ToListAsync(cancellationToken);
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
}
