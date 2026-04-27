using System;
using System.Collections.Generic;
using System.Text;
using InvenTU.Core.Contracts.Repositories;
using InvenTU.Core.DTOs.Suppliers;
using InvenTU.Core.DTOs.Suppliers.PurchaseOrders;
using InvenTU.Core.Entities;
using InvenTU.Core.Enums;
using InvenTU.Infrastructure.Data;
using InvenTU.Infrastructure.Projections;
using Microsoft.EntityFrameworkCore;

namespace InvenTU.Infrastructure.Repositories;

public sealed class SupplierRepository (InvenTUDbContext dbContext) : ISupplierRepository
{
    public async Task CreatePurchaseOrdersAsync(PurchaseOrder purchaseOrder, CancellationToken cancellationToken)
    {
        var result = await dbContext.PurchaseOrders.AddAsync(purchaseOrder);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
    public async Task CreateSupplierAsync(Supplier supplier, CancellationToken cancellationToken)
    {
        await dbContext.Suppliers.AddAsync(supplier, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
    public async Task DeleteSupplierAsync(Supplier supplier, CancellationToken cancellationToken)
    {
        supplier.IsActive = false;
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<PurchaseOrder?> GetPurchaseOrderForUpdateAsync(Guid id, CancellationToken cancellationToken)
    {
        return await dbContext.PurchaseOrders.Where(po => po.Id == id).FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<PurchaseOrderDTO>> GetPurchaseOrdersAsync(PurchaseOrderQueryParams queryParams, CancellationToken cancellationToken)
    {
        var purchaseOrderQuery = dbContext.PurchaseOrders.AsNoTracking();

        if (queryParams.SupplierId != null)
            purchaseOrderQuery = purchaseOrderQuery.Where(po => po.SupplierId == queryParams.SupplierId);

        if (queryParams.Status != null)
            purchaseOrderQuery = purchaseOrderQuery.Where(po => po.Status == queryParams.Status);

        if (queryParams.FromDate != null)
            purchaseOrderQuery = purchaseOrderQuery.Where(po => po.OrderDate >= queryParams.FromDate);

        if (queryParams.ToDate != null)
            purchaseOrderQuery = purchaseOrderQuery.Where(po => po.OrderDate <= queryParams.ToDate);

        return await purchaseOrderQuery
            .Select(PurchaseOrderProjections.ToDto)
            .ToListAsync(cancellationToken);
    }
    public async Task<Supplier?> GetSupplierForUpdateAsync(Guid id, CancellationToken cancellationToken)
    {
        return await dbContext.Suppliers
            .Where(s => s.Id == id)
            .FirstOrDefaultAsync(cancellationToken);
    }
    public async Task<IReadOnlyList<SupplierDTO>> GetSuppliersAsync(CancellationToken cancellationToken)
    {
        return await dbContext.Suppliers
            .Where(s=>s.IsActive)
            .Select(SupplierProjections.ToDto)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> PurchaseOrderExistsForSupplierAsync(Guid id, CancellationToken cancellationToken)
    {
        return await dbContext.PurchaseOrders.AnyAsync(cancellationToken);
    }

    public async Task UpdatePurchaseOrderStatusAsync(PurchaseOrder purchaseOrder, CancellationToken cancellationToken)
    {
        if (purchaseOrder.Status!=PurchaseOrderStatus.Received)
            purchaseOrder.Status++;
        await dbContext.SaveChangesAsync(cancellationToken);
    }
    public async Task UpdateSupplierAsync(Supplier supplier, CancellationToken cancellationToken)
    {
        var result = await dbContext.SaveChangesAsync(cancellationToken);
    }
}
