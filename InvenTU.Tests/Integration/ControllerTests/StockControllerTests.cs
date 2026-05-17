using Microsoft.AspNetCore.Mvc.Testing;

namespace InvenTU.Tests.Integration.ControllerTests;

public sealed class StockControllerTests(InvenTUApplicationFactory factory) : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client = factory.CreateClient();
}
