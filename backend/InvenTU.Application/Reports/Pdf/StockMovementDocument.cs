using InvenTU.Core.DTOs.Reports;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace InvenTU.Application.Reports.Pdf;

/// <summary>
/// QuestPDF document definition for the Stock Movement report.
/// Renders a full audit trail of inventory movements including a filter-summary
/// section, a detailed movement table, and aggregated counts by type and status.
/// Formatted for A4 landscape to accommodate the wide movement table.
/// </summary>
internal sealed class StockMovementDocument : IDocument
{
    private readonly StockMovementReportResponse _data;
    private readonly byte[] _logoBytes;
    private readonly string _generatedAt;

    /// <summary>
    /// Initialises a new instance of <see cref="StockMovementDocument"/>.
    /// </summary>
    /// <param name="data">Fully assembled stock movement report response.</param>
    /// <param name="logoBytes">Raw bytes of the embedded company logo (PNG).</param>
    public StockMovementDocument(StockMovementReportResponse data, byte[] logoBytes)
    {
        _data = data;
        _logoBytes = logoBytes;
        _generatedAt = data.GeneratedAt.ToString("yyyy-MM-dd HH:mm") + " UTC";
    }

    /// <inheritdoc />
    public DocumentMetadata GetMetadata() => new()
    {
        Title = "Stock Movement Report",
        Author = "InvenTU",
        CreationDate = _data.GeneratedAt,
    };

    /// <inheritdoc />
    public DocumentSettings GetSettings() => DocumentSettings.Default;

    /// <inheritdoc />
    public void Compose(IDocumentContainer container)
    {
        container.Page(page =>
        {
            page.Size(PageSizes.A4.Landscape());
            page.Margin(0);
            page.DefaultTextStyle(s => s
                .FontFamily("Helvetica")
                .FontSize(PdfTheme.FontBody)
                .FontColor(PdfTheme.Ink));

            page.Header().Element(ComposeHeader);
            page.Content()
                .PaddingHorizontal(32)
                .PaddingTop(16)
                .PaddingBottom(8)
                .Element(ComposeBody);
            page.Footer()
                .PaddingHorizontal(32)
                .PaddingBottom(14)
                .Element(ComposeFooter);
        });
    }

    // Header

    private void ComposeHeader(IContainer container)
    {
        container.Column(col =>
        {
            // Dark shell banner
            col.Item()
                .Background(PdfTheme.ShellBg)
                .PaddingHorizontal(32)
                .PaddingVertical(14)
                .Row(row =>
                {
                    // FitWidth avoids the circular height dependency that
                    // FitHeight would introduce inside a dynamically-sized row.
                    row.ConstantItem(40).Image(_logoBytes).FitWidth();

                    row.ConstantItem(14); // gap

                    row.RelativeItem().Column(inner =>
                    {
                        inner.Item()
                            .Text("Stock Movement Report")
                            .FontSize(PdfTheme.FontTitle)
                            .FontColor(PdfTheme.ShellInk)
                            .Bold();

                        inner.Item()
                            .Text("Full audit trail of inventory movements")
                            .FontSize(PdfTheme.FontSmall)
                            .FontColor(PdfTheme.ShellMuted);
                    });

                    // ConstantItem gives bounded width → AlignRight is safe.
                    // AlignMiddle is intentionally omitted; see InventoryValuationDocument.
                    row.ConstantItem(170).Column(inner =>
                    {
                        inner.Item().AlignRight()
                            .Text("Generated")
                            .FontSize(PdfTheme.FontSmall)
                            .FontColor(PdfTheme.ShellMuted);

                        inner.Item().AlignRight()
                            .Text(_generatedAt)
                            .FontSize(PdfTheme.FontSmall)
                            .FontColor(PdfTheme.ShellInk);
                    });
                });

            // Orange accent stripe
            col.Item().Height(3).Background(PdfTheme.Accent);
        });
    }

    // Body

    private void ComposeBody(IContainer container)
    {
        container.Column(col =>
        {
            col.Item().PaddingBottom(12).Element(ComposeFilterSummary);
            col.Item().Element(ComposeTable);
            col.Item().PaddingTop(16).Element(ComposeSummarySection);
        });
    }

    private void ComposeFilterSummary(IContainer container)
    {
        var f = _data.Filters;

        container
            .Background(PdfTheme.BgSunk)
            .Border(1).BorderColor(PdfTheme.Rule)
            .Padding(10)
            .Column(col =>
            {
                col.Item()
                    .Text("Filters Applied")
                    .FontSize(PdfTheme.FontTableHead)
                    .FontColor(PdfTheme.InkMuted)
                    .Bold();

                col.Item().PaddingTop(6).Row(row =>
                {
                    // All chips are AutoItem — never use AlignRight on AutoItem.
                    FilterChip(row, "From", f.FromDate?.ToString("yyyy-MM-dd") ?? "—");
                    row.ConstantItem(6);
                    FilterChip(row, "To", f.ToDate?.ToString("yyyy-MM-dd") ?? "—");
                    row.ConstantItem(6);
                    FilterChip(row, "Type", f.MovementType ?? "All");
                    row.ConstantItem(6);
                    FilterChip(row, "Status", f.Status ?? "All");
                    row.ConstantItem(6);
                    FilterChip(row, "WH", f.WarehouseId.HasValue
                        ? f.WarehouseId.Value.ToString()[..8] + "…"
                        : "All");
                    row.ConstantItem(6);
                    FilterChip(row, "Product", f.ProductId.HasValue
                        ? f.ProductId.Value.ToString()[..8] + "…"
                        : "All");

                    // Remaining space acts as a flexible gap pushing the count
                    // to the right via RelativeItem + AlignRight (bounded width).
                    row.RelativeItem().AlignRight()
                        .Text($"{_data.Items.Count:N0} movements")
                        .FontSize(PdfTheme.FontSmall)
                        .FontColor(PdfTheme.Accent)
                        .Bold();
                });
            });
    }

    private void ComposeTable(IContainer container)
    {
        container.Table(table =>
        {
            // Column definitions
            table.ColumnsDefinition(cols =>
            {
                cols.ConstantColumn(72);   // Date
                cols.ConstantColumn(70);   // Reference
                cols.RelativeColumn(2.5f); // Product
                cols.ConstantColumn(52);   // SKU
                cols.ConstantColumn(60);   // Type
                cols.ConstantColumn(46);   // Qty
                cols.RelativeColumn(1.5f); // From
                cols.RelativeColumn(1.5f); // To
                cols.ConstantColumn(54);   // Status
                cols.RelativeColumn(1.5f); // Performed By
            });

            // Header row
            table.Header(header =>
            {
                void H(string text, bool right = false)
                {
                    var cell = header.Cell()
                        .Background(PdfTheme.ShellBg)
                        .PaddingHorizontal(5)
                        .PaddingVertical(4);

                    if (right) cell = cell.AlignRight();

                    cell.Text(text)
                        .FontSize(PdfTheme.FontTableHead)
                        .FontColor(PdfTheme.ShellInk)
                        .Bold();
                }

                H("Date");
                H("Reference");
                H("Product");
                H("SKU");
                H("Type");
                H("Qty", right: true);
                H("From");
                H("To");
                H("Status");
                H("Performed By");
            });

            // Data rows
            var index = 0;
            foreach (var m in _data.Items)
            {
                var bg = index++ % 2 == 0 ? PdfTheme.BgPaper : PdfTheme.BgSunk;

                void D(string? text, bool right = false, string? color = null)
                {
                    IContainer cell = table.Cell()
                        .Background(bg)
                        .BorderBottom(1).BorderColor(PdfTheme.Rule)
                        .PaddingHorizontal(5)
                        .PaddingVertical(3);

                    if (right) cell = cell.AlignRight();

                    if (color is not null)
                        cell.Text(text ?? "—").FontSize(PdfTheme.FontBody).FontColor(color);
                    else
                        cell.Text(text ?? "—").FontSize(PdfTheme.FontBody);
                }

                D(m.CreatedAt.ToString("yyyy-MM-dd HH:mm"));
                D(m.ReferenceNumber);
                D(m.ProductName);
                D(m.SKU);
                D(m.MovementType, color: TypeColor(m.MovementType));
                D(m.Quantity.ToString("N2"), right: true);
                D(m.SourceWarehouse);
                D(m.DestinationWarehouse);
                D(m.Status, color: StatusColor(m.Status));
                D(m.PerformedBy);
            }
        });
    }

    private void ComposeSummarySection(IContainer container)
    {
        container
            .BorderTop(1).BorderColor(PdfTheme.Rule)
            .PaddingTop(12)
            .Row(row =>
            {
                // Counts by type
                row.RelativeItem().Column(col =>
                {
                    SummaryTableHeader(col, "Movements by Type");
                    col.Item().Table(t =>
                    {
                        t.ColumnsDefinition(c =>
                        {
                            c.RelativeColumn();
                            c.ConstantColumn(36);
                        });
                        foreach (var (type, count) in _data.CountsByType.OrderByDescending(x => x.Value))
                        {
                            t.Cell().PaddingVertical(2)
                                .Text(type)
                                .FontSize(PdfTheme.FontSmall)
                                .FontColor(TypeColor(type));
                            t.Cell().AlignRight().PaddingVertical(2)
                                .Text(count.ToString("N0"))
                                .FontSize(PdfTheme.FontSmall)
                                .Bold();
                        }
                    });
                });

                row.ConstantItem(20);

                // Counts by status
                row.RelativeItem().Column(col =>
                {
                    SummaryTableHeader(col, "Movements by Status");
                    col.Item().Table(t =>
                    {
                        t.ColumnsDefinition(c =>
                        {
                            c.RelativeColumn();
                            c.ConstantColumn(36);
                        });
                        foreach (var (status, count) in _data.CountsByStatus.OrderByDescending(x => x.Value))
                        {
                            t.Cell().PaddingVertical(2)
                                .Text(status)
                                .FontSize(PdfTheme.FontSmall)
                                .FontColor(StatusColor(status));
                            t.Cell().AlignRight().PaddingVertical(2)
                                .Text(count.ToString("N0"))
                                .FontSize(PdfTheme.FontSmall)
                                .Bold();
                        }
                    });
                });

                row.ConstantItem(20);

                // Hero total quantity
                row.RelativeItem().Column(col =>
                {
                    SummaryTableHeader(col, "Total Units Moved");
                    col.Item().PaddingTop(6)
                        .Text(_data.TotalQuantityMoved.ToString("N2"))
                        .FontSize(PdfTheme.FontHero)
                        .FontColor(PdfTheme.Accent)
                        .Bold();
                });
            });
    }

    // Footer

    private static void ComposeFooter(IContainer container)
    {
        container
            .BorderTop(1).BorderColor(PdfTheme.Rule)
            .PaddingTop(6)
            .Row(row =>
            {
                row.RelativeItem()
                    .Text("Generated by InvenTU · Confidential")
                    .FontSize(PdfTheme.FontFooter)
                    .FontColor(PdfTheme.InkSubtle);

                row.AutoItem()
                    .Text(t =>
                    {
                        t.Span("Page ")
                            .FontSize(PdfTheme.FontFooter)
                            .FontColor(PdfTheme.InkSubtle);
                        t.CurrentPageNumber()
                            .FontSize(PdfTheme.FontFooter)
                            .FontColor(PdfTheme.Ink);
                        t.Span(" of ")
                            .FontSize(PdfTheme.FontFooter)
                            .FontColor(PdfTheme.InkSubtle);
                        t.TotalPages()
                            .FontSize(PdfTheme.FontFooter)
                            .FontColor(PdfTheme.Ink);
                    });
            });
    }

    // Shared helpers

    /// <summary>
    /// Renders a pill-style filter chip into an <c>AutoItem</c> row slot.
    /// </summary>
    private static void FilterChip(RowDescriptor row, string label, string value)
    {
        row.AutoItem()
            .Background(PdfTheme.BgPaper)
            .Border(1).BorderColor(PdfTheme.RuleStrong)
            .Padding(3).PaddingHorizontal(6)
            .Text(t =>
            {
                t.Span(label + ": ")
                    .FontSize(PdfTheme.FontSmall)
                    .FontColor(PdfTheme.InkMuted);
                t.Span(value)
                    .FontSize(PdfTheme.FontSmall)
                    .FontColor(PdfTheme.Ink)
                    .Bold();
            });
    }

    /// <summary>
    /// Renders the small bold heading and divider rule used above each
    /// summary table in the report tail.
    /// </summary>
    private static void SummaryTableHeader(ColumnDescriptor col, string title)
    {
        col.Item()
            .Text(title)
            .FontSize(PdfTheme.FontSmall)
            .FontColor(PdfTheme.InkMuted)
            .Bold();

        col.Item().Height(1).Background(PdfTheme.Rule);
        col.Item().Height(4); // visual gap
    }

    /// <summary>Returns the theme colour for a given movement type string.</summary>
    private static string TypeColor(string type) => type switch
    {
        "Issue" => PdfTheme.Crit,
        "Receipt" => PdfTheme.Ok,
        "Transfer" => PdfTheme.Warn,
        "Adjustment" => PdfTheme.InkMuted,
        "Count" => PdfTheme.Ink,
        "WriteOff" => PdfTheme.Crit,
        _ => PdfTheme.Ink,
    };

    /// <summary>Returns the theme colour for a given movement status string.</summary>
    private static string StatusColor(string status) => status switch
    {
        "Active" or "Approved" => PdfTheme.Ok,
        "Pending" => PdfTheme.Warn,
        "Cancelled" => PdfTheme.Crit,
        _ => PdfTheme.Ink,
    };
}
