using InvenTU.Core.Enums;

namespace InvenTU.Core.DTOs.AuditLogs;

public sealed class AuditLogQueryParams
{
    public string? EntityType { get; init; }
    public AuditAction? Action { get; init; }
    public Guid? UserId { get; init; }
    public DateTime? FromDate { get; init; }
    public DateTime? ToDate { get; init; }
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 50;
}
