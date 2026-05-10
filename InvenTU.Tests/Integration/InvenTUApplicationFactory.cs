using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using InvenTU.Infrastructure.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using InvenTU.Infrastructure.DataSeeders;
using Microsoft.Extensions.Configuration;

namespace InvenTU.Tests.Integration;

public sealed class InvenTUApplicationFactory : WebApplicationFactory<Program>
{
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

            // Remove actual DB Context
            var realDbContextdescriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<InvenTUDbContext>));
            if (realDbContextdescriptor != null)
                services.Remove(realDbContextdescriptor);

            // Connect to dedicated testing DB
            services.AddDbContext<InvenTUDbContext>(options =>
                options.UseNpgsql(config.GetConnectionString("IntegrationTestConnection")));
        });
    }
}
