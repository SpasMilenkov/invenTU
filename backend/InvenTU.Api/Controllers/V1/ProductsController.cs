using InvenTU.Core.Contracts.Services;
using InvenTU.Core.DTOs.Products;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InvenTU.Api.Controllers.V1;

/// <summary>
/// Controller for managing products.
/// </summary>
[ApiController]
[Route("api/v1/products")]
[Authorize]
public sealed class ProductsController(IProductService productService) : ControllerBase
{
    /// <summary>Returns a paginated, filtered list of active products.</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] ProductQueryParams query,
        CancellationToken cancellationToken)
    {
        var result = await productService.GetPagedAsync(query, cancellationToken);
        return Ok(result);
    }

    /// <summary>Returns a single product by id.</summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var product = await productService.GetByIdAsync(id, cancellationToken);
        return Ok(product);
    }

    /// <summary>Creates a new product. Requires Manager or Admin role.</summary>
    [HttpPost]
    [Authorize(Roles = "Manager,Admin")]
    public async Task<IActionResult> Create(
        [FromBody] CreateProductRequest request,
        CancellationToken cancellationToken)
    {
        var product = await productService.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = product.Id }, product);
    }

    /// <summary>Replaces a product's mutable fields. SKU is immutable. Requires Manager or Admin role.</summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Manager,Admin")]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateProductRequest request,
        CancellationToken cancellationToken)
    {
        var product = await productService.UpdateAsync(id, request, cancellationToken);
        return Ok(product);
    }

    /// <summary>
    /// Soft-deletes (archives) a product by setting DeletedAt.
    /// Returns 409 if the product has stock on hand.
    /// Requires Manager or Admin role.
    /// </summary>
    [HttpPatch("{id:guid}/archive")]
    [Authorize(Roles = "Manager,Admin")]
    public async Task<IActionResult> Archive(Guid id, CancellationToken cancellationToken)
    {
        await productService.ArchiveAsync(id, cancellationToken);
        return NoContent();
    }
}
