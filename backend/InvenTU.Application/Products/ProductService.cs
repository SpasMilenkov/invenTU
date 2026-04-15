using FluentValidation;
using InvenTU.Core.Contracts.Repositories;
using InvenTU.Core.Contracts.Services;
using InvenTU.Core.DTOs.Common;
using InvenTU.Core.DTOs.Products;
using InvenTU.Core.Exceptions;
using InvenTU.Core.Extensions;
using CoreValidationException = InvenTU.Core.Exceptions.ValidationException;

namespace InvenTU.Application.Products;

public sealed class ProductService(
    IProductRepository productRepository,
    IValidator<CreateProductRequest> createValidator,
    IValidator<UpdateProductRequest> updateValidator) : IProductService
{
    public async Task<PagedResult<ProductDto>> GetPagedAsync(
        ProductQueryParams query,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(query);
        return await productRepository.GetPagedAsync(query, cancellationToken);
    }

    public async Task<ProductDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await productRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new ProductNotFoundException(id);
    }

    public async Task<ProductDto> CreateAsync(
        CreateProductRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var validation = await createValidator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            var errors = validation.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(e => e.ErrorMessage).ToArray());
            throw new CoreValidationException(errors);
        }

        var normalizedSku = request.SKU.Trim().ToUpperInvariant();
        if (await productRepository.SkuExistsAsync(normalizedSku, cancellationToken))
            throw new SkuAlreadyExistsException(request.SKU);

        if (!await productRepository.CategoryExistsAsync(request.CategoryId, cancellationToken))
            throw new CategoryNotFoundException(request.CategoryId);

        var product = request.ToEntity();
        await productRepository.AddAsync(product, cancellationToken);

        return await productRepository.GetByIdAsync(product.Id, cancellationToken)
            ?? throw new InvalidOperationException("Failed to retrieve the newly created product.");
    }

    public async Task<ProductDto> UpdateAsync(
        Guid id,
        UpdateProductRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var product = await productRepository.GetForUpdateAsync(id, cancellationToken)
            ?? throw new ProductNotFoundException(id);

        var validation = await updateValidator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            var errors = validation.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(e => e.ErrorMessage).ToArray());
            throw new CoreValidationException(errors);
        }

        if (!await productRepository.CategoryExistsAsync(request.CategoryId, cancellationToken))
            throw new CategoryNotFoundException(request.CategoryId);

        product.ApplyUpdate(request);
        await productRepository.UpdateAsync(product, cancellationToken);

        return await productRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new InvalidOperationException("Failed to retrieve the updated product.");
    }

    public async Task ArchiveAsync(Guid id, CancellationToken cancellationToken = default)
    {
        if (!await productRepository.ExistsAsync(id, cancellationToken))
            throw new ProductNotFoundException(id);

        var totalStock = await productRepository.GetTotalStockAsync(id, cancellationToken);
        if (totalStock > 0)
            throw new ProductHasStockException(totalStock);

        await productRepository.ArchiveAsync(id, DateTime.UtcNow, cancellationToken);
    }
}
