using System;
using System.Collections.Generic;
using System.Text;
using InvenTU.Core.Contracts.Repositories;
using InvenTU.Core.DTOs.Common;
using InvenTU.Core.DTOs.Suppliers;
using InvenTU.Core.DTOs.Suppliers.PurchaseOrders;
using InvenTU.Core.Entities;
using InvenTU.Core.Enums;
using InvenTU.Infrastructure.Data;
using InvenTU.Infrastructure.Projections;
using Microsoft.EntityFrameworkCore;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;

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
    public async Task DeleteSupplierAsync(Guid id, CancellationToken cancellationToken)
    {
        await dbContext.Suppliers.Where(s => s.Id == id).ExecuteDeleteAsync(cancellationToken);
    }

    public async Task<PurchaseOrder?> GetPurchaseOrderForUpdateAsync(Guid id, CancellationToken cancellationToken)
    {
        return await dbContext.PurchaseOrders.Where(po => po.Id == id).FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<PagedResult<PurchaseOrderDTO>> GetPurchaseOrdersAsync(PurchaseOrderQueryParams queryParams, CancellationToken cancellationToken)
    {
        var purchaseOrderQuery = dbContext.PurchaseOrders
            .Include(po => po.Supplier)
            .Include(po => po.CreatedByUser)
            .AsNoTracking();

        if (queryParams.SupplierId != null)
            purchaseOrderQuery = purchaseOrderQuery.Where(po => po.SupplierId == queryParams.SupplierId);

        if (queryParams.Status != null)
            purchaseOrderQuery = purchaseOrderQuery.Where(po => po.Status == queryParams.Status);

        if (queryParams.FromDate != null)
            purchaseOrderQuery = purchaseOrderQuery.Where(po => po.OrderDate >= queryParams.FromDate);

        if (queryParams.ToDate != null)
            purchaseOrderQuery = purchaseOrderQuery.Where(po => po.OrderDate <= queryParams.ToDate);

        var count = await purchaseOrderQuery.CountAsync(cancellationToken);
        var page = Math.Max(1, queryParams.Page);
        var pageSize = Math.Clamp(queryParams.PageSize, 1, 1000);
        

        var rawItems = await purchaseOrderQuery
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(PurchaseOrderProjections.ToDto)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return PagedResult<PurchaseOrderDTO>.Create(rawItems, count, page, pageSize);
    }
    public async Task<Supplier?> GetSupplierForUpdateAsync(Guid id, CancellationToken cancellationToken)
    {
        return await dbContext.Suppliers
            .Where(s => s.Id == id)
            .FirstOrDefaultAsync(cancellationToken);
    }
    public async Task<IReadOnlyList<SupplierDTO>> GetSuppliersAsync(string? search, CancellationToken cancellationToken)
    {
        return await dbContext.Suppliers
            .Where(s => s.IsActive
                && (s.Name.ToUpper().Contains(search ?? "")
                    || s.Address == null ? true : s.Address.ToUpper().Contains(search ?? "")
                    || s.ContactPhone == null ? true : s.ContactPhone.ToUpper().Contains(search ?? "")
                    || s.ContactEmail == null ? true : s.ContactEmail.ToUpper().Contains(search ?? "")
                ))
            .Select(SupplierProjections.ToDto)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> PurchaseOrderExistsForSupplierAsync(Guid id, CancellationToken cancellationToken)
    {
        return await dbContext.PurchaseOrders.AnyAsync(po => po.SupplierId == id, cancellationToken);
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
