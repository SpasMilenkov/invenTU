using System;
using System.Collections.Generic;
using System.Text;
using InvenTU.Core.Contracts.Repositories;
using InvenTU.Core.DTOs.Categories;
using InvenTU.Infrastructure.Data;

namespace InvenTU.Infrastructure.Repositories;

public sealed class CategoryRepository(InvenTUDbContext dbContext) : ICategoryRepository
{
    private readonly InvenTUDbContext _dbContext = dbContext;

    public Task CreateCategoryAsync(CategoryDTO categoryDto) => throw new NotImplementedException();
    public Task DeleteCategoryAsync(string id) => throw new NotImplementedException();
    public Task EditCategoryAsync(CategoryDTO categoryDto) => throw new NotImplementedException();
    public Task<CategoryDTO> GetAllCategoriesAsync() => throw new NotImplementedException();
}
