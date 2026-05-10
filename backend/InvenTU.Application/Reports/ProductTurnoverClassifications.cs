namespace InvenTU.Application.Reports;

/// <summary>
/// String constants for the <see cref="InvenTU.Core.DTOs.Reports.ProductTurnoverDto.Classification"/>
/// field. Producers (the turnover service) and consumers (PDF/CSV exports) must use these
/// constants rather than inline string literals so a rename is caught at compile time.
/// </summary>
internal static class ProductTurnoverClassifications
{
    /// <summary>Annualised turnover ratio above the fast-moving threshold.</summary>
    public const string FastMoving = "FastMoving";

    /// <summary>Annualised turnover ratio below the slow-moving threshold.</summary>
    public const string SlowMoving = "SlowMoving";

    /// <summary>Annualised turnover ratio between the two thresholds.</summary>
    public const string Normal = "Normal";
}
