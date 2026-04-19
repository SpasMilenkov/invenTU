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
    public async Task<IActionResult> GetAllCategories()
    {
        var categories = await _categoryService.GetAllCategoriesAsync();

        return Ok();
    }
    /// <summary>
    /// Creates a new product category
    /// </summary>
    /// <returns></returns>
    [HttpPost]
    [Authorize(Roles = "Manager,Admin")]
    public async Task<IActionResult> CreateCategory(CategoryDTO categoryDto)
    {
        await _categoryService.CreateCategoryAsync(categoryDto);

        return Ok();
    }
    /// <summary>
    /// Modifies an existing product category
    /// </summary>
    /// <param name="id"></param>
    /// <param name="categoryDto"></param>
    /// <returns></returns>
    [HttpPut("{id}")]
    [Authorize(Roles = "Manager,Admin")]
    public async Task<IActionResult> EditCategory(string id, CategoryDTO categoryDto)
    {
        await _categoryService.EditCategoryAsync(categoryDto);

        return Ok();
    }
    /// <summary>
    /// Soft delete on an existing category
    /// </summary>
    /// <param name="id"></param>
    /// <returns></returns>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Manager,Admin")]
    public async Task<IActionResult> DeleteCategory(string id)
    {
        await _categoryService.DeleteCategoryAsync(id);

        return Ok();
    }
}
