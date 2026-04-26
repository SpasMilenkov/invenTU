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
[Route("api/[controller]")]
[ApiController]
[Authorize]
public sealed class SuppliersController (ISupplierService supplierService) : ControllerBase
{
    /// <summary>
    /// Fetching a list of queried suppliers
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns></returns>
    [HttpGet]
    [Authorize(Roles = "Manager,Admin")]
    public async Task<IActionResult> GetSuppliers(CancellationToken cancellationToken)
    {
        var suppliers = await supplierService.GetSuppliersAsync(cancellationToken);

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
    public async Task<IActionResult> GetPurchaseOrders(PurchaseOrderQueryParams purchaseOrderQueryParams, CancellationToken cancellationToken)
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
