using InvenTU.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Testcontainers.PostgreSql;

namespace InvenTU.Tests.Integration;

/// <summary>
/// Boots a single Postgres container for the whole test-run and applies EF
/// migrations exactly once. The connection string is exposed as a static
/// property so per-class factories can read it without needing constructor
/// injection.
///
/// Note: identity role seeding is NOT performed here because it requires the
/// full Identity DI stack (RoleManager, etc.) which is not registered in this
/// minimal service collection. Roles are instead seeded by Program.cs startup
/// when WebApplicationFactory primes the host on first CreateClient() call in
/// TestApplicationFactoryBase.InitializeAsync. IdentityRoleSeeder is idempotent
/// (existence-checked), so the per-class primer calls do not conflict.
/// Respawner is configured with TablesToIgnore = ["AspNetRoles"] so seeded
/// roles survive per-test resets.
/// </summary>
public sealed class IntegrationTestAssemblyFixture : IAsyncLifetime
{
    private PostgreSqlContainer _container = null!;

    public static string ConnectionString { get; private set; } = string.Empty;

    public async ValueTask InitializeAsync()
    {
        _container = new PostgreSqlBuilder()
            .WithImage("postgres:16-alpine")
            .WithDatabase("test_db")
            .WithUsername("user")
            .WithPassword("password")
            .Build();

        await _container.StartAsync();
        ConnectionString = _container.GetConnectionString();

        // Apply EF migrations exactly once for the whole test run.
        var services = new ServiceCollection();
        services.AddDbContext<InvenTUDbContext>(o => o.UseNpgsql(ConnectionString));
        await using var sp = services.BuildServiceProvider();
        using var scope = sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<InvenTUDbContext>();
        await db.Database.MigrateAsync();
    }

    public async ValueTask DisposeAsync()
    {
        if (_container is not null)
            await _container.DisposeAsync();
    }
}
