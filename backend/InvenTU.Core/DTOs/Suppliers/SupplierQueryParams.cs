using InvenTU.Core.Enums;

namespace InvenTU.Core.DTOs.Suppliers;

public sealed class SupplierQueryParams
{
    public string? Search { get; init; }
    public ArchiveStatusFilter Archive { get; init; } = ArchiveStatusFilter.Active;
}
