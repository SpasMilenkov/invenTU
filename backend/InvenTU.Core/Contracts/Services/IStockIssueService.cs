using InvenTU.Core.DTOs.Stock;

namespace InvenTU.Core.Contracts.Services;

public interface IStockIssueService
{
    Task<StockIssueDto> IssueAsync(IssueStockRequest request, CancellationToken cancellationToken = default);
}
