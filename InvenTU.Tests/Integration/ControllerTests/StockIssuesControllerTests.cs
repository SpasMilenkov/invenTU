using System.Net;
using System.Net.Http.Json;
using InvenTU.Core.DTOs.Stock;
using InvenTU.Core.Entities;
using InvenTU.Infrastructure.Data;
using InvenTU.Infrastructure.DataSeeders;
using Microsoft.Extensions.DependencyInjection;

namespace InvenTU.Tests.Integration.ControllerTests;

[Collection("Database")]
public sealed class StockIssuesControllerTests(InvenTUApplicationFactory factory)
    : IntegrationTestBase<InvenTUApplicationFactory>(factory)
{
    private static IssueStockRequest NewIssue(decimal qty) => new()
    {
        ProductId = SeedIds.ProductPhone1,
        WarehouseId = SeedIds.WarehouseMain,
        StockLocationId = SeedIds.LocationMainA1S1,
        Quantity = qty,
        ReasonCode = "test",
    };

    [Fact]
    public async Task Issue_AsWorker_DecrementsStock()
    {
        using var client = Factory.CreateClientAs(Roles.Worker);

        using var pre = Factory.Services.CreateScope();
        var db = pre.ServiceProvider.GetRequiredService<InvenTUDbContext>();
        var item = await db.Set<StockItem>().FindAsync(new object[] { SeedIds.StockItemPhone1 }, TestContext.Current.CancellationToken);
        Assert.NotNull(item);
        var before = item.Quantity;

        var resp = await client.PostAsJsonAsync("/api/v1/stock/issues", NewIssue(1m), TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);

        using var post = Factory.Services.CreateScope();
        var db2 = post.ServiceProvider.GetRequiredService<InvenTUDbContext>();
        var item2 = await db2.Set<StockItem>().FindAsync(new object[] { SeedIds.StockItemPhone1 }, TestContext.Current.CancellationToken);
        Assert.NotNull(item2);
        Assert.Equal(before - 1m, item2.Quantity);
    }

    [Fact]
    public async Task Issue_InsufficientStock_Returns422()
    {
        using var client = Factory.CreateClientAs(Roles.Worker);
        var resp = await client.PostAsJsonAsync("/api/v1/stock/issues", NewIssue(qty: 1_000_000m), TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.UnprocessableEntity, resp.StatusCode);
    }

    [Fact]
    public async Task Issue_Anonymous_Returns401()
    {
        using var client = Factory.CreateAnonymousClient();
        var resp = await client.PostAsJsonAsync("/api/v1/stock/issues", NewIssue(1m), TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Unauthorized, resp.StatusCode);
    }
}
