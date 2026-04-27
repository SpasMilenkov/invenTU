using InvenTU.Core.Contracts.Repositories;
using InvenTU.Core.DTOs.Common;
using InvenTU.Core.DTOs.Products;
using InvenTU.Core.Entities;
using InvenTU.Core.Enums;
using InvenTU.Core.Options;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace InvenTU.Application.Stock;

public sealed class LowStockMonitoringService (IServiceProvider services,
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
                        var totalStock = await productRepository.GetTotalStockAsync(product.Id);

                        await HandleStockAlert(scope, product, product.MinStockLevel, totalStock, AlertType.LowStock, $"{product.Name} has low total stock");
                        await HandleStockAlert(scope, product, product.ReorderPoint, totalStock, AlertType.NeedsReorder, $"Reorders must be made for {product.Name}");
                    }
                }
                while (productsPage.HasNextPage);
            }
            await Task.Delay(TimeSpan.FromMinutes(options.Value.Interval), stoppingToken);
        }
    }
    private async Task HandleStockAlert(
        IServiceScope scope,
        ProductDto product,
        decimal stockThreshold,
        decimal totalStock,
        AlertType alertType,
        string alertMessage = "")
    {
        var alertRepository = scope.ServiceProvider.GetRequiredService<IAlertRepository>();

        var lowStockAlert = await alertRepository.UnresolvedAlertForProductAsync(product.Id, alertType);

        if (totalStock < stockThreshold && lowStockAlert == null)
        {
            await alertRepository.CreateAsync(new Alert
            {
                Id = Guid.NewGuid(),
                AlertType = alertType,
                ProductId = product.Id,
                CurrentQuantity = totalStock,
                MinStockLevel = product.MinStockLevel,
                Message = alertMessage,
                CreatedAt = DateTime.UtcNow,
            });
        }
        else if (totalStock >= stockThreshold && lowStockAlert != null)
            await alertRepository.ResolveAsync(lowStockAlert.Id);
    }
}
