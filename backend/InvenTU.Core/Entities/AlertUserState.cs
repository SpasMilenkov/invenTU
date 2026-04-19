namespace InvenTU.Core.Entities;

public sealed class AlertUserState
{
    public Guid AlertId { get; set; }
    public Guid UserId { get; set; }
    public bool IsRead { get; set; }
    public DateTime? SnoozedUntil { get; set; }

    public Alert Alert { get; set; } = null!;
    public User User { get; set; } = null!;
}
