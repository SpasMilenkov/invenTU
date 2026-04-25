using System.Text;
using InvenTU.Application.Validators;
using FluentValidation;
using InvenTU.Core.Entities;
using InvenTU.Infrastructure.Auth;
using InvenTU.Infrastructure.Data;
using InvenTU.Infrastructure.DataSeeders;
using InvenTU.Infrastructure.Settings;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using InvenTU.Core.Contracts.Repositories;
using InvenTU.Infrastructure.Repositories;
using InvenTU.Core.Contracts.Services;
using InvenTU.Application.Auth;
using InvenTU.Application.Services;
using InvenTU.Application.Alerts;

namespace InvenTU.Infrastructure;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddInvenTUInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);

        services.AddDbContext<InvenTUDbContext>(options =>
            options
                .UseNpgsql(configuration.GetConnectionString("DefaultConnection"))
                // Synchronous seeding — called by EF tooling (dotnet ef database update)
                // and by EnsureCreated. Both sync and async must mirror each other.
                .UseSeeding((context, _) =>
                {
                    if (context is InvenTUDbContext dbContext)
                        SeedOrchestrator.Seed(dbContext);
                })
                // Asynchronous seeding — called at runtime during MigrateAsync().
                .UseAsyncSeeding(async (context, _, ct) =>
                {
                    if (context is InvenTUDbContext dbContext)
                        await SeedOrchestrator.SeedAsync(dbContext, ct);
                }));

        services
            .AddIdentity<User, IdentityRole<Guid>>(options =>
            {
                options.Password.RequireDigit = true;
                options.Password.RequireLowercase = true;
                options.Password.RequireUppercase = true;
                options.Password.RequireNonAlphanumeric = false;
                options.Password.RequiredLength = 8;
                options.User.RequireUniqueEmail = true;
            })
            .AddEntityFrameworkStores<InvenTUDbContext>()
            .AddDefaultTokenProviders();

        var jwtSection = configuration.GetSection(JwtSettings.SectionName);
        services.Configure<JwtSettings>(jwtSection);

        var jwtSettings = jwtSection.Get<JwtSettings>() ?? throw new InvalidOperationException("JwtSettings configuration section is missing.");

        if (string.IsNullOrWhiteSpace(jwtSettings.Secret))
        {
            throw new InvalidOperationException("JWT secret is not configured. Set the JwtSettings__Secret environment variable.");
        }

        var key = Encoding.UTF8.GetBytes(jwtSettings.Secret);

        services
            .AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtSettings.Issuer,
                    ValidAudience = jwtSettings.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ClockSkew = TimeSpan.Zero,
                };

                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        if (string.IsNullOrEmpty(context.Token) &&
                            context.Request.Cookies.TryGetValue("AccessToken", out var cookieToken))
                        {
                            context.Token = cookieToken;
                        }
                        return Task.CompletedTask;
                    }
                };
            });

        services.AddValidatorsFromAssemblyContaining<RegisterDTOValidator>();

        services.AddHttpContextAccessor();

        services.AddScoped<IRefreshTokenStore, RefreshTokenStore>();
        services.AddScoped<IProductRepository, ProductRepository>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IWarehouseRepository, WarehouseRepository>();
        services.AddScoped<IStockLocationRepository, StockLocationRepository>();
        services.AddScoped<IStockItemRepository, StockItemRepository>();
        services.AddScoped<IStockTransferRepository, StockTransferRepository>();
        services.AddScoped<IStockReceiptRepository, StockReceiptRepository>();
        services.AddScoped<IStockIssueRepository, StockIssueRepository>();
        services.AddScoped<IStockAdjustmentRepository, StockAdjustmentRepository>();
        services.AddScoped<IDashboardRepository, DashboardRepository>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddScoped<ICategoryRepository, CategoryRepository>();
        services.AddScoped<IAlertRepository, AlertRepository>();
        services.AddScoped<IAlertService, AlertService>();

        return services;
    }
}
