using System.Net;
using System.Net.Http.Json;
using InvenTU.Core.DTOs.Products;
using InvenTU.Core.Entities;
using InvenTU.Infrastructure.Data;
using InvenTU.Infrastructure.DataSeeders;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace InvenTU.Tests.Integration.ControllerTests;

[Collection("Database")]
public sealed class ProductControllerTests(InvenTUApplicationFactory factory)
    : IntegrationTestBase<InvenTUApplicationFactory>(factory)
{
    private static CreateProductRequest NewProductRequest(string sku) => new()
    {
        SKU = sku,
        Name = $"Test Product {sku}",
        CategoryId = SeedIds.CatPhones,
        UnitPrice = 9.99m,
        CostPrice = 5.00m,
        UnitOfMeasure = "ea",
        IsActive = true,
        MinStockLevel = 1,
        ReorderPoint = 2,
    };

    [Fact]
    public async Task GetAll_AsWorker_ReturnsPaged200()
    {
        using var client = Factory.CreateClientAs(Roles.Worker);
        var resp = await client.GetAsync("/api/v1/products", TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
    }

    [Fact]
    public async Task GetAll_Anonymous_Returns401()
    {
        using var client = Factory.CreateAnonymousClient();
        var resp = await client.GetAsync("/api/v1/products", TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Unauthorized, resp.StatusCode);
    }

    [Fact]
    public async Task GetById_Existing_Returns200()
    {
        using var client = Factory.CreateClientAs(Roles.Worker);
        var resp = await client.GetAsync($"/api/v1/products/{SeedIds.ProductPhone1}", TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        var body = await resp.Content.ReadFromJsonAsync<ProductDto>(TestContext.Current.CancellationToken);
        Assert.NotNull(body);
        Assert.Equal(SeedIds.ProductPhone1, body.Id);
    }

    [Fact]
    public async Task GetById_Missing_Returns404()
    {
        using var client = Factory.CreateClientAs(Roles.Worker);
        var resp = await client.GetAsync($"/api/v1/products/{Guid.NewGuid()}", TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NotFound, resp.StatusCode);
    }

    [Fact]
    public async Task Create_AsManager_PersistsAndReturnsProduct()
    {
        using var client = Factory.CreateClientAs(Roles.Manager);
        var sku = $"SKU-{Guid.NewGuid():N}".Substring(0, 16);
        var req = NewProductRequest(sku);

        var resp = await client.PostAsJsonAsync("/api/v1/products", req, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Created, resp.StatusCode);

        var body = await resp.Content.ReadFromJsonAsync<ProductDto>(TestContext.Current.CancellationToken);
        Assert.NotNull(body);
        Assert.Equal(sku.ToUpperInvariant(), body.SKU);

        var verify = await client.GetAsync($"/api/v1/products/{body.Id}", TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, verify.StatusCode);
    }

    [Fact]
    public async Task Create_AsWorker_Returns403()
    {
        using var client = Factory.CreateClientAs(Roles.Worker);
        var resp = await client.PostAsJsonAsync("/api/v1/products", NewProductRequest("SKU-FORBIDDEN"), TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Forbidden, resp.StatusCode);
    }

    [Fact]
    public async Task Create_DuplicateSku_ReturnsConflict()
    {
        using var client = Factory.CreateClientAs(Roles.Manager);
        var sku = $"SKU-DUP-{Guid.NewGuid():N}".Substring(0, 16);
        var first = await client.PostAsJsonAsync("/api/v1/products", NewProductRequest(sku), TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Created, first.StatusCode);

        var dup = await client.PostAsJsonAsync("/api/v1/products", NewProductRequest(sku), TestContext.Current.CancellationToken);
        Assert.True(dup.StatusCode is HttpStatusCode.Conflict or HttpStatusCode.BadRequest,
            $"Expected Conflict or BadRequest, got {dup.StatusCode}");
    }

    [Fact]
    public async Task Update_AsAdmin_AppliesChanges()
    {
        using var client = Factory.CreateClientAs(Roles.Admin);
        var update = new UpdateProductRequest
        {
            Name = "Renamed Phone 1",
            CategoryId = SeedIds.CatPhones,
            UnitPrice = 123.45m,
            CostPrice = 99.00m,
            UnitOfMeasure = "ea",
            IsActive = true,
            MinStockLevel = 1,
            ReorderPoint = 2,
        };

        var resp = await client.PutAsJsonAsync($"/api/v1/products/{SeedIds.ProductPhone1}", update, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);

        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<InvenTUDbContext>();
        var product = await db.Set<Product>().FindAsync(new object[] { SeedIds.ProductPhone1 }, TestContext.Current.CancellationToken);
        Assert.NotNull(product);
        Assert.Equal("Renamed Phone 1", product.Name);
    }

    [Fact]
    public async Task Archive_ProductWithStock_ReturnsConflict()
    {
        using var client = Factory.CreateClientAs(Roles.Manager);
        var resp = await client.PatchAsync($"/api/v1/products/{SeedIds.ProductPhone1}/archive", content: null, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Conflict, resp.StatusCode);
    }

    [Fact]
    public async Task Archive_ThenRestore_RoundTrip()
    {
        using var client = Factory.CreateClientAs(Roles.Manager);

        var sku = $"RT-{Guid.NewGuid():N}".Substring(0, 16);
        var createResp = await client.PostAsJsonAsync("/api/v1/products", NewProductRequest(sku), TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Created, createResp.StatusCode);
        var created = await createResp.Content.ReadFromJsonAsync<ProductDto>(TestContext.Current.CancellationToken);
        Assert.NotNull(created);

        var archive = await client.PatchAsync($"/api/v1/products/{created.Id}/archive", content: null, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NoContent, archive.StatusCode);

        var restore = await client.PatchAsync($"/api/v1/products/{created.Id}/restore", content: null, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NoContent, restore.StatusCode);
    }
}
