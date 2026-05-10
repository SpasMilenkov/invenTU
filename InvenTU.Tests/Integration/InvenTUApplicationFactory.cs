using System.Data.Common;
using InvenTU.Infrastructure.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
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

        builder.ConfigureServices(services =>
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
        });
    }
    public async Task InitializeAsync(CancellationToken cancellationToken)
    {
        _dbConnection = new NpgsqlConnection(_testConnectionString);

        await _dbConnection.OpenAsync(cancellationToken);

        _respawner = await Respawner.CreateAsync(_dbConnection, new RespawnerOptions
        {
            DbAdapter = DbAdapter.Postgres,
        });
    }
    public async Task ResetDbAsync(CancellationToken cancellationToken)
    {
        await _respawner.ResetAsync(_dbConnection);
    }
}
