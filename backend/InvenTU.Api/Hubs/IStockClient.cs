using InvenTU.Core.DTOs.Stock;

namespace InvenTU.Api.Hubs;

/// <summary>
/// Methods the server can invoke on connected clients.
/// Keep this interface minimal — add new methods here when you need new push channels.
/// </summary>
public interface IStockClient
{
    /// <summary>Pushed after every committed stock movement (receipt, issue, transfer, adjustment).</summary>
    Task ReceiveMovement(StockMovementLiveDto movement);
}
