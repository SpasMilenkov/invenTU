using InvenTU.Core.Contracts.Services;
using InvenTU.Core.DTOs.Suppliers;
using InvenTU.Core.DTOs.Suppliers.PurchaseOrders;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace InvenTU.Api.Controllers.V1;

/// <summary>
/// Controller for managing suppliers and their purchase order pipeline
/// </summary>
[Route("api/v1/suppliers")]
[ApiController]
[Authorize]
public sealed class SuppliersController (ISupplierService supplierService) : ControllerBase
{
    /// <summary>
    /// Fetching a list of queried suppliers, optionally filtered by archive state.
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Manager,Admin")]
    public async Task<IActionResult> GetSuppliers([FromQuery] SupplierQueryParams queryParams, CancellationToken cancellationToken)
    {
        var suppliers = await supplierService.GetSuppliersAsync(queryParams, cancellationToken);

        return Ok(suppliers);
    }
    /// <summary>
    /// Adding a new suppplier
    /// </summary>
    /// <param name="createSupplierRequest">DTO with fields required for supplier creation</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns></returns>
    [HttpPost]
    [Authorize(Roles = "Manager,Admin")]
    public async Task<IActionResult> CreateSupplier(CreateSupplierRequest createSupplierRequest, CancellationToken cancellationToken)
    {
        var newSupplier = await supplierService.CreateSupplierAsync(createSupplierRequest, cancellationToken);

        return Ok(newSupplier);
    }
    /// <summary>
    /// Editing an existing supplier
    /// </summary>
    /// <param name="id">Id of supplier to update</param>
    /// <param name="updateSupplierRequest">DTO with fields to update for supplier</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns></returns>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Manager,Admin")]
    public async Task<IActionResult> UpdateSupplier(Guid id, UpdateSupplierRequest updateSupplierRequest, CancellationToken cancellationToken)
    {
        var updatedSupplier = await supplierService.UpdateSupplierAsync(id, updateSupplierRequest, cancellationToken);

        return Ok(updatedSupplier);
    }
    /// <summary>
    /// Deletes an existing supplier without any purchase orders
    /// </summary>
    /// <param name="id">Id of supplier to delete</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns></returns>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteSupplier(Guid id, CancellationToken cancellationToken)
    {
        await supplierService.DeleteSupplierAsync(id, cancellationToken);

        return Ok();
    }
    /// <summary>
    /// Archives a supplier by setting IsActive = false. Returns 404 if the supplier is already archived or missing.
    /// Requires Manager or Admin role.
    /// </summary>
    [HttpPatch("{id:guid}/archive")]
    [Authorize(Roles = "Manager,Admin")]
    public async Task<IActionResult> Archive(Guid id, CancellationToken cancellationToken)
    {
        await supplierService.ArchiveAsync(id, cancellationToken);
        return NoContent();
    }
    /// <summary>
    /// Restores a previously-archived supplier by setting IsActive = true. Returns 404 if the supplier does not exist or is already active.
    /// Requires Manager or Admin role.
    /// </summary>
    [HttpPatch("{id:guid}/restore")]
    [Authorize(Roles = "Manager,Admin")]
    public async Task<IActionResult> Restore(Guid id, CancellationToken cancellationToken)
    {
        await supplierService.RestoreAsync(id, cancellationToken);
        return NoContent();
    }
    /// <summary>
    /// Creates a new purchase order
    /// </summary>
    /// <param name="createPurchaseOrderRequest">DTO with fields required for purchase order creation</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns></returns>
    [HttpPost("purchase-orders")]
    [Authorize(Roles = "Manager,Admin")]
    public async Task<IActionResult> CreatePurchaseOrder(CreatePurchaseOrderRequest createPurchaseOrderRequest, CancellationToken cancellationToken)
    {
        var newPurchaseOrder = await supplierService.CreatePurchaseOrdersAsync(createPurchaseOrderRequest, cancellationToken);

        return Ok(newPurchaseOrder);
    }
    /// <summary>
    /// Queries a list of purchase order by supplier, status and date
    /// </summary>
    /// <param name="purchaseOrderQueryParams">Parameters for list of purchase orders to fetch</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns></returns>
    [HttpGet("purchase-orders")]
    [Authorize(Roles = "Manager,Admin")]
    public async Task<IActionResult> GetPurchaseOrders([FromQuery] PurchaseOrderQueryParams purchaseOrderQueryParams, CancellationToken cancellationToken)
    {
        var purchaseOrders = await supplierService.GetPurchaseOrdersAsync(purchaseOrderQueryParams, cancellationToken);

        return Ok(purchaseOrders);
    }
    /// <summary>
    /// Moves forward the status of a purchase order
    /// </summary>
    /// <param name="id">Id of purchase order to update the status of</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns></returns>
    [HttpPatch("purchase-orders/{id:guid}/status")]
    [Authorize(Roles = "Manager,Admin")]
    public async Task<IActionResult> UpdatePurchaseOrderStatus(Guid id, CancellationToken cancellationToken)
    {
        await supplierService.UpdatePurchaseOrderStatusAsync(id, cancellationToken);

        return Ok();
    }
}
