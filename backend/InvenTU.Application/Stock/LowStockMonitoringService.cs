using InvenTU.Core.Contracts.Repositories;
using InvenTU.Core.Contracts.Services;
using InvenTU.Core.DTOs.Common;
using InvenTU.Core.DTOs.Products;
using InvenTU.Core.Entities;
using InvenTU.Core.Enums;
using InvenTU.Core.Options;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace InvenTU.Application.Stock;

public sealed class LowStockMonitoringService(IServiceProvider services,
                                                IOptions<StockMonitoringOptions> options) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            using (var scope = services.CreateScope())
            {
                var productRepository = scope.ServiceProvider.GetRequiredService<IProductRepository>();

                PagedResult<ProductDto> productsPage;
                int currPage = 1;
                do
                {
                    productsPage = await productRepository.GetPagedAsync(new ProductQueryParams { Page = currPage++, PageSize = options.Value.ProductBatchSize }, stoppingToken);

                    foreach (var product in productsPage.Items)
                    {
                        var totalStock = await productRepository.GetTotalStockAsync(product.Id, stoppingToken);

                        await HandleStockAlert(scope, product, product.MinStockLevel, totalStock, AlertType.LowStock, $"{product.Name} has low total stock", stoppingToken);
                        await HandleStockAlert(scope, product, product.ReorderPoint, totalStock, AlertType.NeedsReorder, $"Reorders must be made for {product.Name}", stoppingToken);
                    }
                }
                while (productsPage.HasNextPage);
            }
            await Task.Delay(TimeSpan.FromMinutes(options.Value.Interval), stoppingToken);
        }
    }

    private static async Task HandleStockAlert(
        IServiceScope scope,
        ProductDto product,
        decimal stockThreshold,
        decimal totalStock,
        AlertType alertType,
        string alertMessage = "",
        CancellationToken ct = default)
    {
        var alertRepository = scope.ServiceProvider.GetRequiredService<IAlertRepository>();
        var alertService = scope.ServiceProvider.GetRequiredService<IAlertService>();

        var existingAlert = await alertRepository.UnresolvedAlertForProductAsync(product.Id, alertType, ct);

        if (totalStock < stockThreshold && existingAlert == null)
        {
            await alertService.CreateProductAlertAsync(
                alertType,
                alertMessage,
                product.Id,
                totalStock,
                product.MinStockLevel,
                ct: default);
        }
        else if (totalStock >= stockThreshold && existingAlert != null)
            await alertRepository.ResolveAsync(existingAlert.Id, ct);
    }
}
