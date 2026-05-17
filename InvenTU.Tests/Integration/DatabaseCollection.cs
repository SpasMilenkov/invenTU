using Xunit;

namespace InvenTU.Tests.Integration;

/// <summary>
/// xunit collection marker. Every integration test class tagged
/// [Collection("Database")] joins this collection, which forces xunit to
/// serialize them against the shared test database.
///
/// The two factory subclasses are declared as ICollectionFixture so a
/// single host of each is built once per test run and reused across every
/// test in the collection. This replaces the per-class IClassFixture
/// pattern, which built a fresh host for each test class and caused the
/// last alphabetical class (StockTransfers) to hit ObjectDisposed cascades
/// from accumulated lifecycle pressure across 7 factory instances.
/// </summary>
[CollectionDefinition("Database")]
public sealed class DatabaseCollection
    : ICollectionFixture<InvenTUApplicationFactory>,
      ICollectionFixture<InvenTURealAuthFactory>
{
}
