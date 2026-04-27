using InvenTU.Core.DTOs.Alerts;

namespace InvenTU.Api.Hubs;

///<summary>
/// </summary>
public interface IAlertClient
{
    ///<summary>
    /// </summary>
    Task ReceiveAlert(AlertLiveDto alert);
}
