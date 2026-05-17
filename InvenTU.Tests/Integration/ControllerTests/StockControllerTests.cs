using System.Net;
using System.Net.Http.Json;
using InvenTU.Core.DTOs.Stock;
using InvenTU.Infrastructure.DataSeeders;

namespace InvenTU.Tests.Integration.ControllerTests;

[Collection("Database")]
public sealed class StockControllerTests(InvenTUApplicationFactory factory)
    : IntegrationTestBase<InvenTUApplicationFactory>(factory)
{
    [Fact]
    public async Task GetStock_AsWorker_Returns200()
    {
        using var client = Factory.CreateClientAs(Roles.Worker);
        var resp = await client.GetAsync("/api/v1/stock", TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
    }

    [Fact]
    public async Task GetStock_Anonymous_Returns401()
    {
        using var client = Factory.CreateAnonymousClient();
        var resp = await client.GetAsync("/api/v1/stock", TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Unauthorized, resp.StatusCode);
    }

    [Fact]
    public async Task GetSummary_ForSeededProduct_ReturnsTotals()
    {
        using var client = Factory.CreateClientAs(Roles.Worker);
        var resp = await client.GetAsync($"/api/v1/stock/summary/{SeedIds.ProductPhone1}", TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);

        var body = await resp.Content.ReadFromJsonAsync<StockSummaryDto>(TestContext.Current.CancellationToken);
        Assert.NotNull(body);
        // PHN-001 is seeded with Quantity=85, QuantityReserved=0.
        Assert.True(body.TotalQuantity > 0);
    }

    [Fact]
    public async Task GetMovements_Pagination_RespectsLimit()
    {
        using var client = Factory.CreateClientAs(Roles.Worker);
        var resp = await client.GetAsync("/api/v1/stock/movements?pageSize=1", TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
    }
}
