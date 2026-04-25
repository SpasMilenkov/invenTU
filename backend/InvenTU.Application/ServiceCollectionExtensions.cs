using FluentValidation;
using InvenTU.Application.Auth;
using InvenTU.Application.Categories;
using InvenTU.Application.Categories.Validators;
using InvenTU.Application.Products;
using InvenTU.Application.Products.Validators;
using InvenTU.Application.Stock;
using InvenTU.Application.Stock.Validators;
using InvenTU.Application.StockLocations;
using InvenTU.Application.StockLocations.Validators;
using InvenTU.Application.Users;
using InvenTU.Application.Warehouses;
using InvenTU.Application.Warehouses.Validators;
using InvenTU.Core.Contracts.Services;
using InvenTU.Core.DTOs.Categories;
using InvenTU.Core.DTOs.Products;
using InvenTU.Core.DTOs.Stock;
using InvenTU.Core.DTOs.StockLocations;
using InvenTU.Core.DTOs.Warehouses;
using Microsoft.Extensions.DependencyInjection;

namespace InvenTU.Application;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddInvenTUApplication(this IServiceCollection services)
    {
        ArgumentNullException.ThrowIfNull(services);

        services.AddScoped<IProductService, ProductService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IValidator<CreateProductRequest>, CreateProductRequestValidator>();
        services.AddScoped<IValidator<UpdateProductRequest>, UpdateProductRequestValidator>();

        services.AddScoped<IWarehouseService, WarehouseService>();
        services.AddScoped<IValidator<CreateWarehouseRequest>, CreateWarehouseRequestValidator>();
        services.AddScoped<IValidator<UpdateWarehouseRequest>, UpdateWarehouseRequestValidator>();

        services.AddScoped<IStockLocationService, StockLocationService>();
        services.AddScoped<IValidator<CreateStockLocationRequest>, CreateStockLocationRequestValidator>();
        services.AddScoped<IValidator<UpdateStockLocationRequest>, UpdateStockLocationRequestValidator>();

        services.AddScoped<IStockItemService, StockItemService>();
        services.AddScoped<IStockTransferService, StockTransferService>();
        services.AddScoped<IValidator<TransferStockRequest>, TransferStockRequestValidator>();

        services.AddScoped<ICategoryService, CategoryService>();
        services.AddScoped<IValidator<CreateCategoryRequest>, CreateCategoryRequestValidator>();
        services.AddScoped<IValidator<UpdateCategoryRequest>, UpdateCategoryRequestValidator>();

        return services;
    }
}
