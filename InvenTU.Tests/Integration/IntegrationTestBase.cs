namespace InvenTU.Tests.Integration;

/// <summary>
/// Generic base for integration test classes. Resets and reseeds the DB
/// before every test, so each test starts from a known clean state.
/// The factory is registered as an ICollectionFixture on DatabaseCollection
/// and shared across every test class in the "Database" collection (host
/// startup is the expensive part).
/// </summary>
public abstract class IntegrationTestBase<TFactory> : IAsyncLifetime
    where TFactory : TestApplicationFactoryBase
{
    protected TFactory Factory { get; }

    protected IntegrationTestBase(TFactory factory)
    {
        Factory = factory;
    }

    public async ValueTask InitializeAsync()
    {
        await Factory.ResetAndSeedAsync();
    }

    public ValueTask DisposeAsync() => ValueTask.CompletedTask;
}
