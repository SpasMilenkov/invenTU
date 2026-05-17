namespace InvenTU.Tests.Integration;

/// <summary>
/// Integration-test factory that keeps the real JWT authentication pipeline
/// intact. Used by AuthControllerTests to exercise login / register /
/// refresh / logout / current end-to-end through real token issuance and
/// cookie handling.
/// </summary>
public sealed class InvenTURealAuthFactory : TestApplicationFactoryBase
{
    // ConfigureAuthentication intentionally not overridden — the real JWT
    // pipeline registered in Program.cs stays in place.
}
