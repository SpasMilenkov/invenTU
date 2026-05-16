using System.Text.Json;

namespace InvenTU.Core.DTOs.AuditLogs;

public sealed class AuditLogDto
{
    public required Guid Id { get; init; }
    public required string EntityType { get; init; }
    public required Guid EntityId { get; init; }
    public required string Action { get; init; }
    public required JsonElement ChangedFields { get; init; }
    public Guid? UserId { get; init; }
    public string? UserDisplayName { get; init; }
    public required DateTime Timestamp { get; init; }
}
