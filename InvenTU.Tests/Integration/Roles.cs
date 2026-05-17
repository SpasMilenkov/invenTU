namespace InvenTU.Tests.Integration;

/// <summary>
/// Mirrors the role strings used by [Authorize(Roles = ...)] across controllers.
/// Source of truth: backend/InvenTU.Infrastructure/DataSeeders/IdentityRoleSeeder.cs.
/// </summary>
public static class Roles
{
    public const string Admin = "Admin";
    public const string Manager = "Manager";
    public const string Worker = "Worker";
}
