using InvenTU.Tests.Integration;
using Microsoft.AspNetCore.Mvc.Testing;

namespace InvenTU.Tests.Integration.ControllerTests;

public sealed class StockAdjustmentsControllerTests (InvenTUApplicationFactory factory) : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client = factory.CreateClient();
}
