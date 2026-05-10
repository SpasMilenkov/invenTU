using InvenTU.Core.Contracts.Repositories;
using InvenTU.Core.Contracts.Services;
using InvenTU.Core.DTOs.Reports;
using QuestPDF.Fluent;
using QuestPDF.Infrastructure;

namespace InvenTU.Application.Reports.Pdf;

/// <summary>
/// Application-layer implementation of <see cref="IReportsPdfService"/>.
/// Orchestrates data retrieval via <see cref="IReportsService"/> and
/// <see cref="IReportsRepository"/>, then delegates PDF rendering to the
/// QuestPDF document templates in <c>InvenTU.Application.Reports.Pdf</c>.
/// </summary>
/// <remarks>
/// The QuestPDF Community licence is registered once in the static constructor.
/// The embedded company logo is loaded from the assembly manifest on first
/// instantiation and reused for every subsequent PDF generation call.
/// </remarks>
public sealed class ReportsPdfService : IReportsPdfService
{
    private readonly IReportsService _reportsService;
    private readonly IReportsRepository _reportsRepository;
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
    /// Service that computes inventory valuation report data.
    /// </param>
    /// <param name="reportsRepository">
    /// Repository used to fetch stock movement rows for the PDF report.
    /// </param>
    /// <exception cref="InvalidOperationException">
    /// Thrown when the embedded logo resource cannot be located in the assembly
    /// manifest — usually because the file was not set to
    /// <c>EmbeddedResource</c> in the project file.
    /// </exception>
    public ReportsPdfService(
        IReportsService reportsService,
        IReportsRepository reportsRepository)
    {
        _reportsService = reportsService;
        _reportsRepository = reportsRepository;
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
        // Resolve date defaults so the filter summary in the PDF shows
        // concrete values rather than blanks.
        var toDate = queryParams.ToDate ?? DateTime.UtcNow;
        var fromDate = queryParams.FromDate ?? toDate.AddDays(-30);

        var rows = await _reportsRepository.GetStockMovementsForReportAsync(
            fromDate,
            toDate,
            queryParams.WarehouseId,
            queryParams.MovementType,
            queryParams.Status,
            queryParams.ProductId,
            cancellationToken);

        var countsByType = rows
            .GroupBy(r => r.MovementType)
            .ToDictionary(g => g.Key, g => g.Count());

        var countsByStatus = rows
            .GroupBy(r => r.Status)
            .ToDictionary(g => g.Key, g => g.Count());

        var response = new StockMovementReportResponse
        {
            GeneratedAt = DateTime.UtcNow,
            Filters = new StockMovementReportQueryParams
            {
                FromDate = fromDate,
                ToDate = toDate,
                WarehouseId = queryParams.WarehouseId,
                MovementType = queryParams.MovementType,
                Status = queryParams.Status,
                ProductId = queryParams.ProductId,
            },
            Items = rows,
            CountsByType = countsByType,
            CountsByStatus = countsByStatus,
            TotalQuantityMoved = rows.Sum(r => r.Quantity),
        };

        var document = new StockMovementDocument(response, _logoBytes);
        var bytes = document.GeneratePdf();
        var fileName = $"stock-movement-{DateTime.UtcNow:yyyy-MM-dd}.pdf";

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
}
