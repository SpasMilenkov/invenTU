using System.Net;
using System.Net.Http.Json;
using InvenTU.Core.DTOs.Stock;
using InvenTU.Core.Entities;
using InvenTU.Infrastructure.Data;
using InvenTU.Infrastructure.DataSeeders;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace InvenTU.Tests.Integration.ControllerTests;

[Collection("Database")]
public sealed class StockReceiptsControllerTests(InvenTUApplicationFactory factory)
    : IntegrationTestBase<InvenTUApplicationFactory>(factory)
{
    private static ReceiveStockRequest NewReceipt(decimal qty = 10m) => new()
    {
        ProductId = SeedIds.ProductPhone1,
        WarehouseId = SeedIds.WarehouseMain,
        StockLocationId = SeedIds.LocationMainA1S1,
        Quantity = qty,
    };

    [Fact]
    public async Task Receive_AsManager_CreatesMovementAndIncrementsStock()
    {
        using var client = Factory.CreateClientAs(Roles.Manager);

        using var pre = Factory.Services.CreateScope();
        var db = pre.ServiceProvider.GetRequiredService<InvenTUDbContext>();
        var item = await db.Set<StockItem>().FindAsync(new object[] { SeedIds.StockItemPhone1 }, TestContext.Current.CancellationToken);
        Assert.NotNull(item);
        var before = item.Quantity;

        var resp = await client.PostAsJsonAsync("/api/v1/stock/receipts", NewReceipt(qty: 7m), TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);

        using var post = Factory.Services.CreateScope();
        var db2 = post.ServiceProvider.GetRequiredService<InvenTUDbContext>();
        var item2 = await db2.Set<StockItem>().FindAsync(new object[] { SeedIds.StockItemPhone1 }, TestContext.Current.CancellationToken);
        Assert.NotNull(item2);
        Assert.Equal(before + 7m, item2.Quantity);

        var movementExists = await db2.Set<StockMovement>()
            .AnyAsync(m => m.ProductId == SeedIds.ProductPhone1 && m.Quantity == 7m, TestContext.Current.CancellationToken);
        Assert.True(movementExists);
    }

    [Fact]
    public async Task Receive_AsWorker_Returns403()
    {
        using var client = Factory.CreateClientAs(Roles.Worker);
        var resp = await client.PostAsJsonAsync("/api/v1/stock/receipts", NewReceipt(), TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Forbidden, resp.StatusCode);
    }

    [Fact]
    public async Task Receive_Anonymous_Returns401()
    {
        using var client = Factory.CreateAnonymousClient();
        var resp = await client.PostAsJsonAsync("/api/v1/stock/receipts", NewReceipt(), TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Unauthorized, resp.StatusCode);
    }

    [Fact]
    public async Task Receive_InvalidLocation_Returns400()
    {
        using var client = Factory.CreateClientAs(Roles.Manager);
        var req = new ReceiveStockRequest
        {
            ProductId = SeedIds.ProductPhone1,
            WarehouseId = SeedIds.WarehouseMain,
            StockLocationId = Guid.NewGuid(),
            Quantity = 5m,
        };
        var resp = await client.PostAsJsonAsync("/api/v1/stock/receipts", req, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
    }
}
