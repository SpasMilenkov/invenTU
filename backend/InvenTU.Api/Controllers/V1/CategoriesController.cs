using InvenTU.Core.Contracts.Services;
using InvenTU.Core.DTOs.Categories;
using InvenTU.Infrastructure.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace InvenTU.Api.Controllers.V1;

/// <summary>
/// 
/// </summary>
[Route("api/v1/[controller]")]
[ApiController]
[Authorize]
public sealed class CategoriesController(ICategoryService categoryService) : ControllerBase
{
    private readonly ICategoryService _categoryService = categoryService;
    /// <summary>
    /// Returns a nested tree JSON with all available
    /// </summary>
    /// <returns></returns>
    [HttpGet]
    public async Task<IActionResult> GetAllCategories(CancellationToken cancellationToken)
    {
        var categories = await _categoryService.GetAllCategoriesAsync(cancellationToken);

        return Ok(categories);
    }
    /// <summary>
    /// Creates a new product category
    /// </summary>
    /// <returns></returns>
    [HttpPost]
    [Authorize(Roles = "Manager,Admin")]
    public async Task<IActionResult> CreateCategory(CreateCategoryRequest createCategoryRequest, CancellationToken cancellationToken)
    {
        var newCategory = await _categoryService.CreateCategoryAsync(createCategoryRequest, cancellationToken);

        return Ok(newCategory);
    }
    /// <summary>
    /// Modifies an existing product category
    /// </summary>
    /// <param name="id"></param>
    /// <param name="updateCategoryRequest"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Manager,Admin")]
    public async Task<IActionResult> UpdateCategory(Guid id, UpdateCategoryRequest updateCategoryRequest, CancellationToken cancellationToken)
    {
        await _categoryService.UpdateCategoryAsync(id, updateCategoryRequest, cancellationToken);

        return Ok();
    }
    /// <summary>
    /// Soft delete on an existing category
    /// </summary>
    /// <param name="id"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Manager,Admin")]
    public async Task<IActionResult> DeleteCategory(Guid id, CancellationToken cancellationToken)
    {
        await _categoryService.DeleteCategoryAsync(id, cancellationToken);

        return Ok();
    }
}
