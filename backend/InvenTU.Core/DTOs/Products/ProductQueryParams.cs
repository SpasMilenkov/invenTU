namespace InvenTU.Core.DTOs.Products;

public sealed class ProductQueryParams
{
    public string? Search { get; init; }
    public Guid? CategoryId { get; init; }
    public bool? IsActive { get; init; }
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 20;
    public ArchiveStatusFilter Archive { get; init; } = ArchiveStatusFilter.Active;
}
