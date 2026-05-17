using System.Data.Common;
using System.Security.Claims;
using InvenTU.Core.Entities;
using InvenTU.Infrastructure.Data;
using InvenTU.Infrastructure.DataSeeders;
using InvenTU.Tests.Integration.Auth;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using Respawn;

namespace InvenTU.Tests.Integration;

public sealed class InvenTUApplicationFactory : WebApplicationFactory<Program>
{
    private Respawner _respawner = null!;
    private DbConnection _dbConnection = null!;
    private string _testConnectionString = "";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        //todo: init Integration settings
        builder.UseEnvironment("Development");

        builder.ConfigureTestServices(services =>
        {
            // Inject config
            var provider = services.BuildServiceProvider();
            using var scope = provider.CreateScope();
            var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();
            _testConnectionString = config.GetConnectionString("IntegrationTestConnection") ?? "";

            // Remove actual DB Context
            var realDbContextdescriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<InvenTUDbContext>));
            if (realDbContextdescriptor != null)
                services.Remove(realDbContextdescriptor);

            // Connect to dedicated testing DB
            services.AddDbContext<InvenTUDbContext>(options =>
                options.UseNpgsql(_testConnectionString));

            services.AddAuthorization(options =>
                {
                    options.DefaultPolicy = new AuthorizationPolicyBuilder()
                        .AddAuthenticationSchemes("Test")
                        .Combine(options.DefaultPolicy)
                        .Build();
                }).AddAuthentication().AddScheme<AuthenticationSchemeOptions, TestAuthHandler>("Test", _ => { });

            services.AddScoped(_ => new AuthClaimProvider());

            var db = scope.ServiceProvider.GetRequiredService<InvenTUDbContext>();

            db.Database.Migrate();
            db.Database.EnsureCreated();
        });
    }
    public async Task InitializeAsync()
    {
        _dbConnection = new NpgsqlConnection(_testConnectionString);

        await _dbConnection.OpenAsync();

        _respawner = await Respawner.CreateAsync(_dbConnection, new RespawnerOptions
        {
            DbAdapter = DbAdapter.Postgres,
        });
    }
    public async Task ResetDbAsync()
    {
        await _respawner.ResetAsync(_dbConnection);
    }
    public async Task SeedDbAsync(IServiceScope scope)
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<InvenTUDbContext>();

        await dbContext.Database.MigrateAsync();
        await SeedOrchestrator.SeedAsync(dbContext);
    }
}
