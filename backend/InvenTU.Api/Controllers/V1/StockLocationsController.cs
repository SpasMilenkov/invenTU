using InvenTU.Core.Contracts.Services;
using InvenTU.Core.DTOs.StockLocations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InvenTU.Api.Controllers.V1;

/// <summary>
/// Controller for managing stock locations nested under warehouses.
/// All endpoints require authentication.
/// Admins and Managers have full access; Users can view locations but not create/update/delete.
/// </summary>
[ApiController]
[Route("api/v1/warehouses/{warehouseId:guid}/locations")]
[Authorize]
public sealed class StockLocationsController(IStockLocationService stockLocationService) : ControllerBase
{
    /// <summary>Returns all stock locations for a warehouse. Optionally filter by zone.</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(Guid warehouseId, [FromQuery] string? zone, CancellationToken cancellationToken)
    {
        var locations = await stockLocationService.GetAllByWarehouseAsync(warehouseId, zone, cancellationToken);
        return Ok(locations);
    }

    /// <summary>Returns a single stock location by id.</summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid warehouseId, Guid id, CancellationToken cancellationToken)
    {
        var location = await stockLocationService.GetByIdAsync(warehouseId, id, cancellationToken);
        return Ok(location);
    }

    /// <summary>Creates a new stock location in the warehouse. Requires Manager or Admin role.</summary>
    [HttpPost]
    [Authorize(Roles = "Manager,Admin")]
    public async Task<IActionResult> Create(Guid warehouseId, [FromBody] CreateStockLocationRequest request, CancellationToken cancellationToken)
    {
        var location = await stockLocationService.CreateAsync(warehouseId, request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { warehouseId, id = location.Id }, location);
    }

    /// <summary>Updates a stock location's zone, aisle, shelf, bin, and capacity. Requires Manager or Admin role.</summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Manager,Admin")]
    public async Task<IActionResult> Update(Guid warehouseId, Guid id, [FromBody] UpdateStockLocationRequest request, CancellationToken cancellationToken)
    {
        var location = await stockLocationService.UpdateAsync(warehouseId, id, request, cancellationToken);
        return Ok(location);
    }

    /// <summary>
    /// Hard-deletes a stock location.
    /// Returns 409 if the location has any stock on hand.
    /// Requires Manager or Admin role.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Manager,Admin")]
    public async Task<IActionResult> Delete(Guid warehouseId, Guid id, CancellationToken cancellationToken)
    {
        await stockLocationService.DeleteAsync(warehouseId, id, cancellationToken);
        return NoContent();
    }
}
