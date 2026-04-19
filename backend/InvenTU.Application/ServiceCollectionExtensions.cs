using FluentValidation;
using InvenTU.Application.Auth;
using InvenTU.Application.Products;
using InvenTU.Application.Products.Validators;
using InvenTU.Application.Users;
using InvenTU.Application.Warehouses;
using InvenTU.Application.Warehouses.Validators;
using InvenTU.Core.Contracts.Services;
using InvenTU.Core.DTOs.Products;
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

        return services;
    }
}
