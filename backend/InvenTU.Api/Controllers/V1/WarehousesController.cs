using InvenTU.Core.Contracts.Services;
using InvenTU.Core.DTOs.Warehouses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InvenTU.Api.Controllers.V1;

/// <summary>
/// Controller for managing warehouses. All endpoints require authentication.
/// Admins and Managers have full access; Users can view warehouses but not create/update/delete.
/// </summary>
[ApiController]
[Route("api/v1/warehouses")]
[Authorize]
public sealed class WarehousesController(IWarehouseService warehouseService) : ControllerBase
{
    /// <summary>Returns a paged list of warehouses with stock summary counts. Supports search and status filtering.</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] WarehouseStatusFilter status = WarehouseStatusFilter.All,
        CancellationToken cancellationToken = default)
    {
        var result = await warehouseService.GetAllAsync(page, pageSize, search, status, cancellationToken);
        return Ok(result);
    }

    /// <summary>Returns a single warehouse by id.</summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var warehouse = await warehouseService.GetByIdAsync(id, cancellationToken);
        return Ok(warehouse);
    }

    /// <summary>Creates a new warehouse. Requires Manager or Admin role.</summary>
    [HttpPost]
    [Authorize(Roles = "Manager,Admin")]
    public async Task<IActionResult> Create([FromBody] CreateWarehouseRequest request, CancellationToken cancellationToken)
    {
        var warehouse = await warehouseService.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = warehouse.Id }, warehouse);
    }

    /// <summary>
    /// Replaces a warehouse's mutable fields. Code is immutable.
    /// Requires Manager or Admin role.
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Manager,Admin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateWarehouseRequest request, CancellationToken cancellationToken)
    {
        var warehouse = await warehouseService.UpdateAsync(id, request, cancellationToken);
        return Ok(warehouse);
    }

    /// <summary>
    /// Hard-deletes a warehouse.
    /// Returns 409 if the warehouse has any stock on hand.
    /// Requires Manager or Admin role.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Manager,Admin")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await warehouseService.DeleteAsync(id, cancellationToken);
        return NoContent();
    }

    /// <summary>
    /// Deactivates a warehouse, preventing new stock transfers to it.
    /// Requires Manager or Admin role.
    /// </summary>
    [HttpPatch("{id:guid}/deactivate")]
    [Authorize(Roles = "Manager,Admin")]
    public async Task<IActionResult> Deactivate(Guid id, CancellationToken cancellationToken)
    {
        await warehouseService.DeactivateAsync(id, cancellationToken);
        return NoContent();
    }

    /// <summary>
    /// Reactivates a previously deactivated warehouse.
    /// Requires Manager or Admin role.
    /// </summary>
    [HttpPatch("{id:guid}/activate")]
    [Authorize(Roles = "Manager,Admin")]
    public async Task<IActionResult> Activate(Guid id, CancellationToken cancellationToken)
    {
        await warehouseService.ActivateAsync(id, cancellationToken);
        return NoContent();
    }
}
