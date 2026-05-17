using InvenTU.Application.Reports;
using InvenTU.Core.DTOs.Reports;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace InvenTU.Application.Reports.Pdf;

/// <summary>
/// QuestPDF document definition for the Product Turnover report.
/// Renders an annualised turnover ratio per product, ordered by ratio
/// descending, with summary cards for the date range and a classification
/// chip in each row. Formatted for A4 portrait.
/// </summary>
internal sealed class TurnoverDocument : IDocument
{
    private readonly TurnoverReportResponse _data;
    private readonly byte[] _logoBytes;
    private readonly string _generatedAt;

    public TurnoverDocument(TurnoverReportResponse data, byte[] logoBytes)
    {
        _data = data;
        _logoBytes = logoBytes;
        _generatedAt = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm") + " UTC";
    }

    public DocumentMetadata GetMetadata() => new()
    {
        Title = "Product Turnover Report",
        Author = "InvenTU",
        CreationDate = DateTime.UtcNow,
    };

    public DocumentSettings GetSettings() => DocumentSettings.Default;

    public void Compose(IDocumentContainer container)
    {
        container.Page(page =>
        {
            page.Size(PageSizes.A4);
            page.Margin(0);
            page.DefaultTextStyle(s => s
                .FontFamily("Helvetica")
                .FontSize(PdfTheme.FontBody)
                .FontColor(PdfTheme.Ink));

            page.Header().Element(ComposeHeader);
            page.Content()
                .PaddingHorizontal(32)
                .PaddingTop(20)
                .PaddingBottom(8)
                .Element(ComposeBody);
            page.Footer()
                .PaddingHorizontal(32)
                .PaddingBottom(16)
                .Element(ComposeFooter);
        });
    }

    private void ComposeHeader(IContainer container)
    {
        container.Column(col =>
        {
            col.Item()
                .Background(PdfTheme.ShellBg)
                .PaddingHorizontal(32)
                .PaddingVertical(16)
                .Row(row =>
                {
                    row.ConstantItem(40).Image(_logoBytes).FitWidth();
                    row.ConstantItem(14);

                    row.RelativeItem().Column(inner =>
                    {
                        inner.Item()
                            .Text("Product Turnover Report")
                            .FontSize(PdfTheme.FontTitle)
                            .FontColor(PdfTheme.ShellInk)
                            .Bold();

                        inner.Item()
                            .Text($"Annualised over {_data.DaysInPeriod} day(s) · Issued units ÷ average stock")
                            .FontSize(PdfTheme.FontSmall)
                            .FontColor(PdfTheme.ShellMuted);
                    });

                    row.ConstantItem(150).Column(inner =>
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

            col.Item().Height(3).Background(PdfTheme.Accent);

            col.Item()
                .Background(PdfTheme.AccentTint)
                .BorderBottom(1).BorderColor(PdfTheme.AccentSoft)
                .PaddingHorizontal(32)
                .PaddingVertical(7)
                .Row(row =>
                {
                    row.AutoItem()
                        .Text("Window: ")
                        .FontSize(PdfTheme.FontSmall)
                        .FontColor(PdfTheme.InkMuted)
                        .Bold();

                    row.AutoItem()
                        .Text($"{_data.FromDate:yyyy-MM-dd} → {_data.ToDate:yyyy-MM-dd}")
                        .FontSize(PdfTheme.FontSmall)
                        .FontColor(PdfTheme.AccentDeep)
                        .Bold();
                });
        });
    }

    private void ComposeBody(IContainer container)
    {
        container.Column(col =>
        {
            col.Item().PaddingBottom(16).Row(row =>
            {
                SummaryCard(row.RelativeItem(),
                    "Total products",
                    _data.Items.Count.ToString("N0"),
                    PdfTheme.Ink);

                row.ConstantItem(12);

                var fast = _data.Items.Count(i => i.Classification == ProductTurnoverClassifications.FastMoving);
                SummaryCard(row.RelativeItem(),
                    "Fast moving",
                    fast.ToString("N0"),
                    PdfTheme.Accent);

                row.ConstantItem(12);

                var slow = _data.Items.Count(i => i.Classification == ProductTurnoverClassifications.SlowMoving);
                SummaryCard(row.RelativeItem(),
                    "Slow moving",
                    slow.ToString("N0"),
                    PdfTheme.Ink);
            });

            col.Item().Element(ComposeTable);
        });
    }

    private void ComposeTable(IContainer container)
    {
        container.Table(table =>
        {
            table.ColumnsDefinition(cols =>
            {
                cols.ConstantColumn(58);   // SKU
                cols.RelativeColumn(3);    // Name
                cols.ConstantColumn(70);   // Units issued
                cols.ConstantColumn(70);   // Avg stock
                cols.ConstantColumn(70);   // Ratio
                cols.ConstantColumn(82);   // Classification
            });

            table.Header(header =>
            {
                void H(string text, bool right = false)
                {
                    var cell = header.Cell()
                        .Background(PdfTheme.ShellBg)
                        .PaddingHorizontal(6)
                        .PaddingVertical(5);

                    if (right) cell = cell.AlignRight();

                    cell.Text(text)
                        .FontSize(PdfTheme.FontTableHead)
                        .FontColor(PdfTheme.ShellInk)
                        .Bold();
                }

                H("SKU");
                H("Product");
                H("Units issued", right: true);
                H("Avg stock", right: true);
                H("Ratio", right: true);
                H("Classification");
            });

            var index = 0;
            foreach (var item in _data.Items)
            {
                var bg = index++ % 2 == 0 ? PdfTheme.BgPaper : PdfTheme.BgSunk;

                void D(string text, bool right = false, string? color = null)
                {
                    IContainer cell = table.Cell()
                        .Background(bg)
                        .BorderBottom(1).BorderColor(PdfTheme.Rule)
                        .PaddingHorizontal(6)
                        .PaddingVertical(4);

                    if (right) cell = cell.AlignRight();

                    if (color is not null)
                        cell.Text(text).FontSize(PdfTheme.FontBody).FontColor(color);
                    else
                        cell.Text(text).FontSize(PdfTheme.FontBody);
                }

                D(item.SKU);
                D(item.ProductName);
                D(item.TotalUnitsIssued.ToString("N2"), right: true);
                D(item.AverageStockLevel.ToString("N2"), right: true);
                D(item.TurnoverRatio.ToString("N4"), right: true);

                var classColor = item.Classification switch
                {
                    ProductTurnoverClassifications.FastMoving => PdfTheme.Accent,
                    ProductTurnoverClassifications.SlowMoving => PdfTheme.InkMuted,
                    _ => PdfTheme.Ink,
                };
                D(item.Classification, color: classColor);
            }
        });
    }

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

    private static void SummaryCard(
        IContainer container, string label, string value, string valueColor)
    {
        container
            .Background(PdfTheme.BgSunk)
            .Border(1).BorderColor(PdfTheme.Rule)
            .Padding(12)
            .Column(c =>
            {
                c.Item()
                    .Text(label)
                    .FontSize(PdfTheme.FontSmall)
                    .FontColor(PdfTheme.InkMuted);

                c.Item()
                    .Text(value)
                    .FontSize(14)
                    .FontColor(valueColor)
                    .Bold();
            });
    }
}
