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
using InvenTU.Core.Exceptions;
using Moq;
using CoreValidationException = InvenTU.Core.Exceptions.ValidationException;

namespace InvenTU.Tests.Unit;

public sealed class StockIssueServiceTests
{
    private static readonly IssueStockRequest ValidRequest = new()
    {
        WarehouseId = Guid.NewGuid(),
        StockLocationId = Guid.NewGuid(),
        ProductId = Guid.NewGuid(),
        Quantity = 5m,
    };

    private static (StockIssueService svc,
                    Mock<IWarehouseRepository> wh,
                    Mock<IStockLocationRepository> loc,
                    Mock<IStockIssueRepository> repo,
                    Mock<IProductRepository> prod,
                    Mock<ICurrentUserService> usr,
                    Mock<ILiveFeedService> feed,
                    Mock<IValidator<IssueStockRequest>> val) Build(bool valid = true)
    {
        var wh = new Mock<IWarehouseRepository>();
        var loc = new Mock<IStockLocationRepository>();
        var repo = new Mock<IStockIssueRepository>();
        var usr = new Mock<ICurrentUserService>();
        var feed = new Mock<ILiveFeedService>();
        var prod = new Mock<IProductRepository>();
        var val = new Mock<IValidator<IssueStockRequest>>();
        val.Setup(v => v.ValidateAsync(It.IsAny<IssueStockRequest>(), It.IsAny<CancellationToken>()))
           .ReturnsAsync(valid
               ? new ValidationResult()
               : new ValidationResult(new[] { new ValidationFailure("X", "fail") }));

        var svc = new StockIssueService(wh.Object, loc.Object, repo.Object, prod.Object, usr.Object, feed.Object, val.Object);
        return (svc, wh, loc, repo, prod, usr, feed, val);
    }

    [Fact]
    public async Task IssueAsync_ValidationFails_Throws()
    {
        var (svc, _, _, _, _, _, _, _) = Build(valid: false);
        await Assert.ThrowsAsync<CoreValidationException>(() => svc.IssueAsync(ValidRequest));
    }

    [Fact]
    public async Task IssueAsync_WarehouseMissing_Throws()
    {
        var (svc, wh, _, _, _, _, _, _) = Build();
        wh.Setup(r => r.GetForUpdateAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
          .ReturnsAsync((Warehouse?)null);
        await Assert.ThrowsAsync<WarehouseNotFoundException>(() => svc.IssueAsync(ValidRequest));
    }

    [Fact]
    public async Task IssueAsync_WarehouseInactive_Throws()
    {
        var (svc, wh, _, _, _, _, _, _) = Build();
        wh.Setup(r => r.GetForUpdateAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
          .ReturnsAsync(new Warehouse { Id = ValidRequest.WarehouseId, IsActive = false });
        await Assert.ThrowsAsync<WarehouseNotActiveException>(() => svc.IssueAsync(ValidRequest));
    }

    [Fact]
    public async Task IssueAsync_LocationMissing_Throws()
    {
        var (svc, wh, loc, _, _, _, _, _) = Build();
        wh.Setup(r => r.GetForUpdateAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
          .ReturnsAsync(new Warehouse { Id = ValidRequest.WarehouseId, IsActive = true });
        loc.Setup(r => r.GetForUpdateAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
           .ReturnsAsync((StockLocation?)null);
        await Assert.ThrowsAsync<StockLocationInvalidException>(() => svc.IssueAsync(ValidRequest));
    }
}
