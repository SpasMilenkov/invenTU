using System.Text;
using InvenTU.Application.Auth;
using InvenTU.Application.Validators;
using FluentValidation;
using InvenTU.Core.Entities;
using InvenTU.Infrastructure.Auth;
using InvenTU.Infrastructure.Data;
using InvenTU.Infrastructure.Settings;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using InvenTU.Infrastructure.DataSeeders;
using InvenTU.Application;
using InvenTU.Core.Contracts.Repositories;
using InvenTU.Infrastructure.Repositories;

namespace InvenTU.Infrastructure;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddInvenTUInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);

        services.AddDbContext<InvenTUDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

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
            });

        services.AddValidatorsFromAssemblyContaining<RegisterDTOValidator>();

        services.AddScoped<IRefreshTokenStore, RefreshTokenStore>();
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<IAuthService, AuthService>();

        services.AddInvenTUApplication();
        services.AddScoped<IProductRepository, ProductRepository>();

        return services;
    }
}
