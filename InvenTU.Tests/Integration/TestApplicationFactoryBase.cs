using System.Data.Common;
using InvenTU.Core.Entities;
using InvenTU.Infrastructure.Data;
using InvenTU.Infrastructure.DataSeeders;
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

public abstract class TestApplicationFactoryBase : WebApplicationFactory<Program>, IAsyncLifetime
{
    private Respawner _respawner = null!;
    private DbConnection _dbConnection = null!;
    private string _testConnectionString = string.Empty;
    private HttpClient _primer = null!;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");

        builder.ConfigureTestServices(services =>
        {
            _testConnectionString = IntegrationTestAssemblyFixture.ConnectionString;
            if (string.IsNullOrEmpty(_testConnectionString))
                throw new InvalidOperationException(
                    "IntegrationTestAssemblyFixture.ConnectionString is empty. " +
                    "The assembly fixture should have run before any test class fixture.");

            var realDbContextDescriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<InvenTUDbContext>))
                ?? throw new InvalidOperationException(
                    "Expected DbContextOptions<InvenTUDbContext> registration to swap was not found.");
            services.Remove(realDbContextDescriptor);

            services.AddDbContext<InvenTUDbContext>(options => options.UseNpgsql(_testConnectionString));

            ConfigureAuthentication(services);
        });
    }

    protected virtual void ConfigureAuthentication(IServiceCollection services) { }

    public async ValueTask InitializeAsync()
    {
        // Prime host startup so DbContext and all services are registered + Program.cs's
        // startup block (MigrateAsync, IdentityRoleSeeder, DevUserSeeder, DevDataSeeder)
        // runs. The primer HttpClient is stored as a field (NOT disposed via `using`)
        // because disposing it mid-init can cascade through HttpMessageHandler →
        // TestServer → host → IServiceProvider, causing intermittent ObjectDisposed
        // races in ResetAndSeedAsync (Transfer was the consistent victim). The primer
        // is disposed in our DisposeAsync override at end of factory lifetime instead.
        _primer = CreateClient();
        try { await _primer.GetAsync(new Uri("/api/v1/health", UriKind.Relative)); }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            // Any HTTP error response is fine; we only need the side effect of starting the host.
        }

        _dbConnection = new NpgsqlConnection(_testConnectionString);
        await _dbConnection.OpenAsync();

        _respawner = await Respawner.CreateAsync(_dbConnection, new RespawnerOptions
        {
            DbAdapter = DbAdapter.Postgres,
            SchemasToInclude = new[] { "public" },
            TablesToIgnore = new[]
            {
                new Respawn.Graph.Table("AspNetRoles"),
                new Respawn.Graph.Table("__EFMigrationsHistory"),
            },
        });
    }

    public override async ValueTask DisposeAsync()
    {
        Console.WriteLine($"[DISPOSE-ASYNC] {DateTime.UtcNow:HH:mm:ss.fff} factory={GetType().Name} hash={GetHashCode()} stack=\n{Environment.StackTrace}");
        _primer?.Dispose();
        if (_dbConnection is not null) await _dbConnection.DisposeAsync();
        await base.DisposeAsync();
    }

    protected override void Dispose(bool disposing)
    {
        Console.WriteLine($"[DISPOSE-SYNC] {DateTime.UtcNow:HH:mm:ss.fff} factory={GetType().Name} hash={GetHashCode()} disposing={disposing} stack=\n{Environment.StackTrace}");
        base.Dispose(disposing);
    }

    public async Task ResetAndSeedAsync()
    {
        Console.WriteLine($"[RESET-START] {DateTime.UtcNow:HH:mm:ss.fff} factory={GetType().Name} hash={GetHashCode()}");
        await _respawner.ResetAsync(_dbConnection);

        // Reset the test auth state so each test starts with no stamped claims.
        // The InvenTUApplicationFactory subclass registers AuthClaimProvider as a singleton.
        using (var authScope = Services.CreateScope())
        {
            var provider = authScope.ServiceProvider.GetService<InvenTU.Tests.Integration.Auth.AuthClaimProvider>();
            provider?.Claims.Clear();
        }

        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<InvenTUDbContext>();
        var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();

        // Order: roles → users → fixtures → dev data. Roles must be reseeded
        // every test because Respawn empties AspNetRoles despite TablesToIgnore
        // (the ignore is honored for __EFMigrationsHistory but not AspNetRoles —
        // suspected schema/FK-graph interaction). Without roles in place,
        // DevUserSeeder's RoleExistsAsync check silently skips admin creation.
        // IdentityRoleSeeder is idempotent (existence-checked) so the per-test
        // cost is negligible.
        await IdentityRoleSeeder.SeedRolesAsync(Services);
        await DevUserSeeder.SeedAsync(Services, config);
        await SeedOrchestrator.SeedAsync(db);
        await DevDataSeeder.SeedAsync(Services);

        // Diagnostic guard: verify seeders left the DB in the state every test depends on.
        // DevUserSeeder swallows IdentityResult failures (logs + continue), so a broken
        // admin reseed otherwise cascades into confusing 500s from CurrentUserService and
        // 401s on admin login. Fail loud here with enough context to pick the right fix.
        using var verifyScope = Services.CreateScope();
        var verifyDb = verifyScope.ServiceProvider.GetRequiredService<InvenTUDbContext>();
        var adminExists = await verifyDb.Set<User>().AnyAsync(u => u.Id == SeedIds.DevAdminUserId);
        var userCount = await verifyDb.Set<User>().CountAsync();
        var roleNames = await verifyDb.Set<IdentityRole<Guid>>().Select(r => r.Name!).ToListAsync();
        if (!adminExists || roleNames.Count < 3)
        {
            throw new InvalidOperationException(
                "ResetAndSeedAsync diagnostic guard tripped. " +
                $"DevAdminUserId present: {adminExists}. " +
                $"User count: {userCount}. " +
                $"Role count: {roleNames.Count}. " +
                $"Roles found: [{string.Join(", ", roleNames)}].");
        }

        Console.WriteLine($"[RESET-END] {DateTime.UtcNow:HH:mm:ss.fff} factory={GetType().Name} hash={GetHashCode()}");
    }
}
