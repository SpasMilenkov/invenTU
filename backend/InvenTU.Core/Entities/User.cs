using Microsoft.AspNetCore.Identity;

namespace InvenTU.Core.Entities;

public sealed class User : IdentityUser<Guid>
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;

    public ICollection<RefreshToken> RefreshTokens { get; set; } = [];
    public ICollection<StockMovement> CreatedStockMovements { get; set; } = [];
    public ICollection<PurchaseOrder> CreatedPurchaseOrders { get; set; } = [];
    public ICollection<AlertUserState> AlertUserStates { get; set; } = [];
}
