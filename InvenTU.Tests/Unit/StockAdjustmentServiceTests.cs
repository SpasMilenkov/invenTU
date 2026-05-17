// Suppress xUnit1051: Moq's It.IsAny<CancellationToken>() is the correct matcher
// for Setup lambdas, but the xunit analyzer cannot distinguish it from a real
// async call missing the test CT. Unit tests are CPU-bound and complete in
// milliseconds, so cancellation responsiveness is not a meaningful concern here.
#pragma warning disable xUnit1051

using FluentValidation;
using FluentValidation.Results;
using InvenTU.Application.Auth;
using InvenTU.Application.Stock;
using InvenTU.Core.Contracts.Repositories;
using InvenTU.Core.Contracts.Services;
using InvenTU.Core.DTOs.Auth;
using InvenTU.Core.DTOs.Stock;
using InvenTU.Core.Entities;
using InvenTU.Core.Enums;
using InvenTU.Core.Exceptions;
using Moq;
using CoreValidationException = InvenTU.Core.Exceptions.ValidationException;

namespace InvenTU.Tests.Unit;

public sealed class StockAdjustmentServiceTests
{
    private static readonly AdjustStockRequest ValidRequest = new()
    {
        WarehouseId = Guid.NewGuid(),
        StockLocationId = Guid.NewGuid(),
        ProductId = Guid.NewGuid(),
        CountedQuantity = 10m,
    };

    private static (StockAdjustmentService svc,
                    Mock<IWarehouseRepository> wh,
                    Mock<IStockLocationRepository> loc,
                    Mock<IStockAdjustmentRepository> repo,
                    Mock<ICurrentUserService> usr,
                    Mock<ILiveFeedService> feed,
                    Mock<IValidator<AdjustStockRequest>> val) Build(bool valid = true)
    {
        var wh = new Mock<IWarehouseRepository>();
        var loc = new Mock<IStockLocationRepository>();
        var repo = new Mock<IStockAdjustmentRepository>();
        var usr = new Mock<ICurrentUserService>();
        var feed = new Mock<ILiveFeedService>();
        var val = new Mock<IValidator<AdjustStockRequest>>();

        val.Setup(v => v.ValidateAsync(It.IsAny<AdjustStockRequest>(), It.IsAny<CancellationToken>()))
           .ReturnsAsync(valid
                ? new ValidationResult()
                : new ValidationResult(new[] { new ValidationFailure("X", "fail") }));

        var svc = new StockAdjustmentService(wh.Object, loc.Object, repo.Object, usr.Object, feed.Object, val.Object);
        return (svc, wh, loc, repo, usr, feed, val);
    }

    [Fact]
    public async Task SubmitAsync_ValidationFails_ThrowsValidationException()
    {
        var (svc, _, _, _, _, _, _) = Build(valid: false);
        await Assert.ThrowsAsync<CoreValidationException>(() => svc.SubmitAsync(ValidRequest));
    }

    [Fact]
    public async Task SubmitAsync_WarehouseMissing_ThrowsWarehouseNotFound()
    {
        var (svc, wh, _, _, _, _, _) = Build();
        wh.Setup(r => r.GetForUpdateAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
          .ReturnsAsync((Warehouse?)null);
        await Assert.ThrowsAsync<WarehouseNotFoundException>(() => svc.SubmitAsync(ValidRequest));
    }

    [Fact]
    public async Task SubmitAsync_WarehouseInactive_ThrowsWarehouseNotActive()
    {
        var (svc, wh, _, _, _, _, _) = Build();
        wh.Setup(r => r.GetForUpdateAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
          .ReturnsAsync(new Warehouse { Id = ValidRequest.WarehouseId, IsActive = false });
        await Assert.ThrowsAsync<WarehouseNotActiveException>(() => svc.SubmitAsync(ValidRequest));
    }

    [Fact]
    public async Task SubmitAsync_LocationMissing_ThrowsStockLocationInvalid()
    {
        var (svc, wh, loc, _, _, _, _) = Build();
        wh.Setup(r => r.GetForUpdateAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
          .ReturnsAsync(new Warehouse { Id = ValidRequest.WarehouseId, IsActive = true });
        loc.Setup(r => r.GetForUpdateAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
           .ReturnsAsync((StockLocation?)null);
        await Assert.ThrowsAsync<StockLocationInvalidException>(() => svc.SubmitAsync(ValidRequest));
    }

    [Fact]
    public async Task SubmitAsync_NoCurrentUser_Throws()
    {
        var (svc, wh, loc, _, usr, _, _) = Build();
        wh.Setup(r => r.GetForUpdateAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
          .ReturnsAsync(new Warehouse { Id = ValidRequest.WarehouseId, IsActive = true });
        loc.Setup(r => r.GetForUpdateAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
           .ReturnsAsync(new StockLocation { Id = ValidRequest.StockLocationId });
        usr.Setup(u => u.GetCurrentUserAsync()).ReturnsAsync((CurrentUserDTO?)null);
        await Assert.ThrowsAsync<InvalidOperationException>(() => svc.SubmitAsync(ValidRequest));
    }

    [Fact]
    public async Task SubmitAsync_HappyPath_PassesTenPercentThresholdToRepository()
    {
        var (svc, wh, loc, repo, usr, _, _) = Build();
        var movementId = Guid.NewGuid();

        wh.Setup(r => r.GetForUpdateAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
          .ReturnsAsync(new Warehouse { Id = ValidRequest.WarehouseId, IsActive = true, Name = "WH" });
        loc.Setup(r => r.GetForUpdateAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
           .ReturnsAsync(new StockLocation { Id = ValidRequest.StockLocationId });
        usr.Setup(u => u.GetCurrentUserAsync())
           .ReturnsAsync(new CurrentUserDTO { UserId = Guid.NewGuid() });

        // Return type: (Guid MovementId, decimal PreviousQuantity, MovementStatus Status)
        repo.Setup(r => r.SubmitAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<decimal>(),
                It.IsAny<decimal>(), It.IsAny<Guid>(),
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((movementId, 0m, MovementStatus.Active));

        repo.Setup(r => r.GetAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new StockAdjustmentDto { Status = "Active" });

        await svc.SubmitAsync(ValidRequest);

        repo.Verify(r => r.SubmitAsync(
            ValidRequest.ProductId,
            ValidRequest.StockLocationId,
            ValidRequest.WarehouseId,
            ValidRequest.CountedQuantity,
            0.10m,                      // THE THRESHOLD WE'RE PINNING
            It.IsAny<Guid>(),
            It.IsAny<string?>(),
            It.IsAny<string?>(),
            It.IsAny<CancellationToken>()), Times.Once);
    }
}
