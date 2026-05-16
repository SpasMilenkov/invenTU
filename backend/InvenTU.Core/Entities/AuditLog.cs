using InvenTU.Core.Enums;

namespace InvenTU.Core.Entities;

public sealed class AuditLog
{
    public Guid Id { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public Guid EntityId { get; set; }
    public AuditAction Action { get; set; }
    public string ChangedFields { get; set; } = string.Empty;
    public Guid? UserId { get; set; }
    public DateTime Timestamp { get; set; }

    public User? User { get; set; }
}
