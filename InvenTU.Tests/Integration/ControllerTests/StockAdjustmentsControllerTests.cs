using System.Net;
using System.Net.Http.Json;
using InvenTU.Core.DTOs.Stock;
using InvenTU.Core.Entities;
using InvenTU.Infrastructure.Data;
using InvenTU.Infrastructure.DataSeeders;
using Microsoft.Extensions.DependencyInjection;

namespace InvenTU.Tests.Integration.ControllerTests;

[Collection("Database")]
public sealed class StockAdjustmentsControllerTests(InvenTUApplicationFactory factory)
    : IntegrationTestBase<InvenTUApplicationFactory>(factory)
{
    private async Task<decimal> GetSeededOnHandAsync()
    {
        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<InvenTUDbContext>();
        var item = await db.Set<StockItem>().FindAsync(new object[] { SeedIds.StockItemPhone1 }, TestContext.Current.CancellationToken);
        Assert.NotNull(item);
        return item.Quantity;
    }

    private static AdjustStockRequest NewAdjust(decimal counted) => new()
    {
        WarehouseId = SeedIds.WarehouseMain,
        StockLocationId = SeedIds.LocationMainA1S1,
        ProductId = SeedIds.ProductPhone1,
        CountedQuantity = counted,
        Notes = "integration test",
    };

    [Fact]
    public async Task Submit_SmallDelta_AutoApproves()
    {
        var onHand = await GetSeededOnHandAsync();
        using var client = Factory.CreateClientAs(Roles.Worker);
        // +1 on a baseline of 85 is ~1.18% — well within ±10%.
        var resp = await client.PostAsJsonAsync("/api/v1/stock/adjustments", NewAdjust(onHand + 1m), TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);

        var dto = await resp.Content.ReadFromJsonAsync<StockAdjustmentDto>(TestContext.Current.CancellationToken);
        Assert.NotNull(dto);
        Assert.Equal("Active", dto.Status);

        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<InvenTUDbContext>();
        var item = await db.Set<StockItem>().FindAsync(new object[] { SeedIds.StockItemPhone1 }, TestContext.Current.CancellationToken);
        Assert.NotNull(item);
        Assert.Equal(onHand + 1m, item.Quantity);
    }

    [Fact]
    public async Task Submit_LargeDelta_GoesPending()
    {
        var onHand = await GetSeededOnHandAsync();
        using var client = Factory.CreateClientAs(Roles.Worker);
        var resp = await client.PostAsJsonAsync("/api/v1/stock/adjustments", NewAdjust(onHand * 5m + 100m), TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);

        var dto = await resp.Content.ReadFromJsonAsync<StockAdjustmentDto>(TestContext.Current.CancellationToken);
        Assert.NotNull(dto);
        Assert.Equal("PendingApproval", dto.Status);

        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<InvenTUDbContext>();
        var item = await db.Set<StockItem>().FindAsync(new object[] { SeedIds.StockItemPhone1 }, TestContext.Current.CancellationToken);
        Assert.NotNull(item);
        Assert.Equal(onHand, item.Quantity);
    }

    [Fact]
    public async Task Submit_NegativeCount_ForcesPending()
    {
        using var client = Factory.CreateClientAs(Roles.Worker);
        var resp = await client.PostAsJsonAsync("/api/v1/stock/adjustments", NewAdjust(-1m), TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);

        var dto = await resp.Content.ReadFromJsonAsync<StockAdjustmentDto>(TestContext.Current.CancellationToken);
        Assert.NotNull(dto);
        Assert.Equal("PendingApproval", dto.Status);
    }

    [Fact]
    public async Task Submit_Anonymous_Returns401()
    {
        using var client = Factory.CreateAnonymousClient();
        var resp = await client.PostAsJsonAsync("/api/v1/stock/adjustments", NewAdjust(1m), TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Unauthorized, resp.StatusCode);
    }

    [Fact]
    public async Task GetPending_AsManager_ReturnsPendingOnly()
    {
        var onHand = await GetSeededOnHandAsync();
        using var worker = Factory.CreateClientAs(Roles.Worker);
        await worker.PostAsJsonAsync("/api/v1/stock/adjustments", NewAdjust(onHand * 5m + 100m), TestContext.Current.CancellationToken);

        using var manager = Factory.CreateClientAs(Roles.Manager);
        var resp = await manager.GetAsync("/api/v1/stock/adjustments/pending", TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);

        var list = await resp.Content.ReadFromJsonAsync<List<StockAdjustmentDto>>(TestContext.Current.CancellationToken);
        Assert.NotNull(list);
        Assert.NotEmpty(list);
        Assert.All(list, a => Assert.Equal("PendingApproval", a.Status));
    }

    [Fact]
    public async Task GetPending_AsWorker_Returns403()
    {
        using var client = Factory.CreateClientAs(Roles.Worker);
        var resp = await client.GetAsync("/api/v1/stock/adjustments/pending", TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Forbidden, resp.StatusCode);
    }

    [Fact]
    public async Task Approve_AsManager_ApprovesAdjustmentAndUpdatesStock()
    {
        var onHand = await GetSeededOnHandAsync();

        using var worker = Factory.CreateClientAs(Roles.Worker);
        var submitResp = await worker.PostAsJsonAsync("/api/v1/stock/adjustments", NewAdjust(onHand * 5m + 100m), TestContext.Current.CancellationToken);
        var pending = await submitResp.Content.ReadFromJsonAsync<StockAdjustmentDto>(TestContext.Current.CancellationToken);
        Assert.NotNull(pending);
        Assert.Equal("PendingApproval", pending.Status);

        using var manager = Factory.CreateClientAs(Roles.Manager);
        var approveResp = await manager.PatchAsJsonAsync(
            $"/api/v1/stock/adjustments/{pending.MovementId}/approve",
            new ReviewAdjustmentRequest { Reason = "ok" },
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, approveResp.StatusCode);

        var approved = await approveResp.Content.ReadFromJsonAsync<StockAdjustmentDto>(TestContext.Current.CancellationToken);
        Assert.NotNull(approved);
        Assert.Equal("Approved", approved.Status);

        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<InvenTUDbContext>();
        var item = await db.Set<StockItem>().FindAsync(new object[] { SeedIds.StockItemPhone1 }, TestContext.Current.CancellationToken);
        Assert.NotNull(item);
        Assert.Equal(onHand * 5m + 100m, item.Quantity);
    }

    [Fact]
    public async Task Approve_AsWorker_Returns403()
    {
        var onHand = await GetSeededOnHandAsync();
        using var manager = Factory.CreateClientAs(Roles.Manager);
        var submitResp = await manager.PostAsJsonAsync("/api/v1/stock/adjustments", NewAdjust(onHand * 5m + 100m), TestContext.Current.CancellationToken);
        var pending = await submitResp.Content.ReadFromJsonAsync<StockAdjustmentDto>(TestContext.Current.CancellationToken);
        Assert.NotNull(pending);

        using var worker = Factory.CreateClientAs(Roles.Worker);
        var approveResp = await worker.PatchAsJsonAsync(
            $"/api/v1/stock/adjustments/{pending.MovementId}/approve",
            new ReviewAdjustmentRequest { Reason = "no" },
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Forbidden, approveResp.StatusCode);
    }

    [Fact]
    public async Task Reject_AsManager_LeavesStockUnchanged()
    {
        var onHand = await GetSeededOnHandAsync();

        using var worker = Factory.CreateClientAs(Roles.Worker);
        var submitResp = await worker.PostAsJsonAsync("/api/v1/stock/adjustments", NewAdjust(onHand * 5m + 100m), TestContext.Current.CancellationToken);
        var pending = await submitResp.Content.ReadFromJsonAsync<StockAdjustmentDto>(TestContext.Current.CancellationToken);
        Assert.NotNull(pending);
        Assert.Equal("PendingApproval", pending.Status);

        using var manager = Factory.CreateClientAs(Roles.Manager);
        var rejectResp = await manager.PatchAsJsonAsync(
            $"/api/v1/stock/adjustments/{pending.MovementId}/reject",
            new ReviewAdjustmentRequest { Reason = "nope" },
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, rejectResp.StatusCode);

        var rejected = await rejectResp.Content.ReadFromJsonAsync<StockAdjustmentDto>(TestContext.Current.CancellationToken);
        Assert.NotNull(rejected);
        Assert.Equal("Rejected", rejected.Status);

        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<InvenTUDbContext>();
        var item = await db.Set<StockItem>().FindAsync(new object[] { SeedIds.StockItemPhone1 }, TestContext.Current.CancellationToken);
        Assert.NotNull(item);
        Assert.Equal(onHand, item.Quantity);
    }

    [Fact]
    public async Task Approve_AlreadyActiveAdjustment_Returns409Conflict()
    {
        var onHand = await GetSeededOnHandAsync();

        using var manager = Factory.CreateClientAs(Roles.Manager);
        // Small delta → auto-approved (status = Active), never PendingApproval.
        var submitResp = await manager.PostAsJsonAsync("/api/v1/stock/adjustments", NewAdjust(onHand + 1m), TestContext.Current.CancellationToken);
        var active = await submitResp.Content.ReadFromJsonAsync<StockAdjustmentDto>(TestContext.Current.CancellationToken);
        Assert.NotNull(active);
        Assert.Equal("Active", active.Status);

        var approveResp = await manager.PatchAsJsonAsync(
            $"/api/v1/stock/adjustments/{active.MovementId}/approve",
            new ReviewAdjustmentRequest { Reason = "again?" },
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Conflict, approveResp.StatusCode);
    }
}
