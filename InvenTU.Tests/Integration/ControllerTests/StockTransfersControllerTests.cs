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
public sealed class StockTransfersControllerTests(InvenTUApplicationFactory factory)
    : IntegrationTestBase<InvenTUApplicationFactory>(factory)
{
    private static TransferStockRequest NewTransfer(decimal qty) => new()
    {
        ProductId = SeedIds.ProductPhone1,
        SourceWarehouseId = SeedIds.WarehouseMain,
        SourceStockLocationId = SeedIds.LocationMainA1S1,
        DestinationWarehouseId = SeedIds.WarehouseNorth,
        DestinationStockLocationId = SeedIds.LocationNorthB1S1,
        Quantity = qty,
    };

    [Fact]
    public async Task Transfer_AsManager_MovesStockBetweenLocations()
    {
        using var client = Factory.CreateClientAs(Roles.Manager);

        using var pre = Factory.Services.CreateScope();
        var db = pre.ServiceProvider.GetRequiredService<InvenTUDbContext>();
        var sourceItem = await db.Set<StockItem>().FindAsync(new object[] { SeedIds.StockItemPhone1 }, TestContext.Current.CancellationToken);
        Assert.NotNull(sourceItem);
        var sourceBefore = sourceItem.Quantity;

        var resp = await client.PostAsJsonAsync("/api/v1/stock/transfers", NewTransfer(2m), TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);

        using var post = Factory.Services.CreateScope();
        var db2 = post.ServiceProvider.GetRequiredService<InvenTUDbContext>();
        var sourceItem2 = await db2.Set<StockItem>().FindAsync(new object[] { SeedIds.StockItemPhone1 }, TestContext.Current.CancellationToken);
        Assert.NotNull(sourceItem2);
        Assert.Equal(sourceBefore - 2m, sourceItem2.Quantity);

        var destinationOnHand = await db2.Set<StockItem>()
            .Where(i => i.ProductId == SeedIds.ProductPhone1 && i.StockLocationId == SeedIds.LocationNorthB1S1)
            .Select(i => i.Quantity)
            .FirstOrDefaultAsync(TestContext.Current.CancellationToken);
        Assert.Equal(2m, destinationOnHand);
    }

    [Fact]
    public async Task Transfer_AsWorker_Returns403()
    {
        using var client = Factory.CreateClientAs(Roles.Worker);
        var resp = await client.PostAsJsonAsync("/api/v1/stock/transfers", NewTransfer(1m), TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Forbidden, resp.StatusCode);
    }

    [Fact]
    public async Task Transfer_InsufficientSourceStock_Returns422()
    {
        using var client = Factory.CreateClientAs(Roles.Manager);
        var resp = await client.PostAsJsonAsync("/api/v1/stock/transfers", NewTransfer(1_000_000m), TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.UnprocessableEntity, resp.StatusCode);
    }

    [Fact]
    public async Task Transfer_Anonymous_Returns401()
    {
        using var client = Factory.CreateAnonymousClient();
        var resp = await client.PostAsJsonAsync("/api/v1/stock/transfers", NewTransfer(1m), TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Unauthorized, resp.StatusCode);
    }
}
