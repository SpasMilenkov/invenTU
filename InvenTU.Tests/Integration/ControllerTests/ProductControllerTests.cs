using Microsoft.AspNetCore.Mvc.Testing;

namespace InvenTU.Tests.Integration.ControllerTests;

public sealed class ProductControllerTests(InvenTUApplicationFactory factory) : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client = factory.CreateClient();
}
