using InvenTU.Core.Contracts.Services;
using InvenTU.Core.DTOs.Reports;
using QuestPDF.Fluent;
using QuestPDF.Infrastructure;

namespace InvenTU.Application.Reports.Pdf;

/// <summary>
/// Application-layer implementation of <see cref="IReportsPdfService"/>.
/// Orchestrates data retrieval via <see cref="IReportsService"/>, then delegates
/// PDF rendering to the QuestPDF document templates in
/// <c>InvenTU.Application.Reports.Pdf</c>.
/// </summary>
/// <remarks>
/// The QuestPDF Community licence is registered once in the static constructor.
/// The embedded company logo is loaded from the assembly manifest on first
/// instantiation and reused for every subsequent PDF generation call.
/// </remarks>
public sealed class ReportsPdfService : IReportsPdfService
{
    private readonly IReportsService _reportsService;
    private readonly byte[] _logoBytes;

    // Static initialisation

    /// <summary>
    /// Registers the QuestPDF Community licence once per application lifetime.
    /// </summary>
    static ReportsPdfService()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    // Constructor

    /// <summary>
    /// Initialises a new instance of <see cref="ReportsPdfService"/>, loading
    /// the embedded company logo from the assembly manifest.
    /// </summary>
    /// <param name="reportsService">
    /// Service that computes report data (inventory valuation, stock movement, etc.).
    /// </param>
    /// <exception cref="InvalidOperationException">
    /// Thrown when the embedded logo resource cannot be located in the assembly
    /// manifest — usually because the file was not set to
    /// <c>EmbeddedResource</c> in the project file.
    /// </exception>
    public ReportsPdfService(IReportsService reportsService)
    {
        _reportsService = reportsService;
        _logoBytes = LoadLogoBytes();
    }

    // IReportsPdfService

    /// <inheritdoc />
    public async Task<(byte[] Bytes, string FileName)> GenerateInventoryValuationPdfAsync(
        InventoryValuationQueryParams queryParams,
        CancellationToken cancellationToken)
    {
        var data = await _reportsService.GetInventoryValuationAsync(
            queryParams.WarehouseId,
            queryParams.CategoryId,
            cancellationToken);

        var document = new InventoryValuationDocument(data, _logoBytes);
        var bytes = document.GeneratePdf();
        var fileName = $"inventory-valuation-{DateTime.UtcNow:yyyy-MM-dd}.pdf";

        return (bytes, fileName);
    }

    /// <inheritdoc />
    public async Task<(byte[] Bytes, string FileName)> GenerateStockMovementPdfAsync(
        StockMovementReportQueryParams queryParams,
        CancellationToken cancellationToken)
    {
        var response = await _reportsService.GetStockMovementReportAsync(
            queryParams,
            cancellationToken);

        var document = new StockMovementDocument(response, _logoBytes);
        var bytes = document.GeneratePdf();
        var fileName = $"stock-movement-{DateTime.UtcNow:yyyy-MM-dd}.pdf";

        return (bytes, fileName);
    }

    /// <inheritdoc />
    public async Task<(byte[] Bytes, string FileName)> GenerateTurnoverPdfAsync(
        TurnoverQueryParams queryParams,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(queryParams);

        var toDate = EnsureUtc(queryParams.ToDate ?? DateTime.UtcNow);
        var fromDate = EnsureUtc(queryParams.FromDate ?? toDate.AddDays(-90));

        var data = await _reportsService.GetTurnoverAsync(fromDate, toDate, cancellationToken);

        var document = new TurnoverDocument(data, _logoBytes);
        var bytes = document.GeneratePdf();
        var fileName = $"product-turnover-{DateTime.UtcNow:yyyy-MM-dd}.pdf";

        return (bytes, fileName);
    }

    // Private helpers

    /// <summary>
    /// Reads the embedded company logo from the assembly manifest and returns
    /// its raw bytes.
    /// </summary>
    /// <returns>PNG bytes of the embedded logo.</returns>
    /// <exception cref="InvalidOperationException">
    /// Thrown when the manifest resource cannot be found.
    /// </exception>
    private static byte[] LoadLogoBytes()
    {
        var assembly = typeof(ReportsPdfService).Assembly;
        const string key = "InvenTU.Application.Resources.logo.png";

        using var stream = assembly.GetManifestResourceStream(key)
            ?? throw new InvalidOperationException(
                $"Embedded resource '{key}' not found. " +
                "Ensure Resources/logo.png exists in InvenTU.Application and its " +
                "Build Action is set to EmbeddedResource in the .csproj.");

        using var ms = new MemoryStream();
        stream.CopyTo(ms);
        return ms.ToArray();
    }

    private static DateTime EnsureUtc(DateTime value) =>
        value.Kind == DateTimeKind.Utc ? value : DateTime.SpecifyKind(value, DateTimeKind.Utc);
}
