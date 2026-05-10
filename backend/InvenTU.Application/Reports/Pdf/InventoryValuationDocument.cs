using InvenTU.Core.DTOs.Reports;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace InvenTU.Application.Reports.Pdf;

/// <summary>
/// QuestPDF document definition for the Inventory Valuation report.
/// Renders a FIFO-valued stock snapshot with optional warehouse / category
/// filter indicators, a per-product table ordered by SKU, and a grand-total
/// footer row.  Formatted for A4 portrait.
/// </summary>
internal sealed class InventoryValuationDocument : IDocument
{
    private readonly InventoryValuationResponse _data;
    private readonly byte[] _logoBytes;
    private readonly string _generatedAt;

    /// <summary>
    /// Initialises a new instance of <see cref="InventoryValuationDocument"/>.
    /// </summary>
    /// <param name="data">Fully computed valuation response to render.</param>
    /// <param name="logoBytes">Raw bytes of the embedded company logo (PNG).</param>
    public InventoryValuationDocument(InventoryValuationResponse data, byte[] logoBytes)
    {
        _data = data;
        _logoBytes = logoBytes;
        _generatedAt = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm") + " UTC";
    }

    /// <inheritdoc />
    public DocumentMetadata GetMetadata() => new()
    {
        Title = "Inventory Valuation Report",
        Author = "InvenTU",
        CreationDate = DateTime.UtcNow,
    };

    /// <inheritdoc />
    public DocumentSettings GetSettings() => DocumentSettings.Default;

    /// <inheritdoc />
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

    // Header

    private void ComposeHeader(IContainer container)
    {
        container.Column(col =>
        {
            // Dark shell banner
            col.Item()
                .Background(PdfTheme.ShellBg)
                .PaddingHorizontal(32)
                .PaddingVertical(16)
                .Row(row =>
                {
                    // FitWidth scales the image to the fixed 40 pt column width;
                    // height derives from the aspect ratio so there is no circular
                    // size dependency with the row height.
                    row.ConstantItem(40).Image(_logoBytes).FitWidth();

                    row.ConstantItem(14); // gap

                    // Title + subtitle stacked in a column.
                    // AlignMiddle is intentionally omitted — QuestPDF cannot resolve
                    // vertical centering when the row height is still being computed.
                    row.RelativeItem().Column(inner =>
                    {
                        inner.Item()
                            .Text("Inventory Valuation Report")
                            .FontSize(PdfTheme.FontTitle)
                            .FontColor(PdfTheme.ShellInk)
                            .Bold();

                        inner.Item()
                            .Text("FIFO cost basis · Figures in base currency")
                            .FontSize(PdfTheme.FontSmall)
                            .FontColor(PdfTheme.ShellMuted);
                    });

                    // Date block: ConstantItem gives a bounded width so
                    // AlignRight is safe here.  Each line sits in its own
                    // Column item rather than using a multi-span Text call.
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

            // Orange accent stripe
            col.Item().Height(3).Background(PdfTheme.Accent);

            // Active-filter bar (only when at least one filter is set) ─
            if (_data.WarehouseId.HasValue || _data.CategoryId.HasValue)
            {
                col.Item()
                    .Background(PdfTheme.AccentTint)
                    .BorderBottom(1).BorderColor(PdfTheme.AccentSoft)
                    .PaddingHorizontal(32)
                    .PaddingVertical(7)
                    .Row(row =>
                    {
                        // AutoItem shrinks to content; never combine with
                        // AlignRight because AutoItem has no bounded width.
                        row.AutoItem()
                            .Text("Filters applied: ")
                            .FontSize(PdfTheme.FontSmall)
                            .FontColor(PdfTheme.InkMuted)
                            .Bold();

                        row.ConstantItem(6);

                        if (_data.WarehouseId.HasValue)
                        {
                            FilterChip(row, "Warehouse",
                                _data.WarehouseId.Value.ToString()[..8] + "…");
                            row.ConstantItem(6);
                        }

                        if (_data.CategoryId.HasValue)
                        {
                            FilterChip(row, "Category",
                                _data.CategoryId.Value.ToString()[..8] + "…");
                        }
                    });
            }
        });
    }

    // Body

    private void ComposeBody(IContainer container)
    {
        container.Column(col =>
        {
            col.Item().PaddingBottom(16).Row(row =>
            {
                SummaryCard(row.RelativeItem(),
                    "Total SKUs",
                    _data.Items.Count.ToString("N0"),
                    PdfTheme.Ink);

                row.ConstantItem(12);

                SummaryCard(row.RelativeItem(),
                    "Grand Total Value",
                    _data.GrandTotal.ToString("N2"),
                    PdfTheme.Accent);
            });

            col.Item().Element(ComposeTable);
        });
    }

    private void ComposeTable(IContainer container)
    {
        container.Table(table =>
        {
            // Column definitions
            table.ColumnsDefinition(cols =>
            {
                cols.ConstantColumn(58);   // SKU
                cols.RelativeColumn(3);    // Product Name
                cols.RelativeColumn(2);    // Category
                cols.ConstantColumn(56);   // On-Hand Qty
                cols.ConstantColumn(72);   // Unit Cost
                cols.ConstantColumn(82);   // Total Value
            });

            // Header row
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
                H("Product Name");
                H("Category");
                H("On-Hand Qty", right: true);
                H("Unit Cost", right: true);
                H("Total Value", right: true);
            });

            // Data rows
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
                D(item.Name);
                D(item.Category);
                D(item.TotalQuantity.ToString("N2"), right: true);
                D(item.UnitCost.ToString("N4"), right: true);
                D(item.TotalValue.ToString("N2"), right: true);
            }

            // Grand total row
            table.Cell()
                .ColumnSpan(5)
                .Background(PdfTheme.AccentTint)
                .BorderTop(2).BorderColor(PdfTheme.Accent)
                .PaddingHorizontal(6).PaddingVertical(7)
                .AlignRight()
                .Text("Grand Total")
                .FontSize(PdfTheme.FontBody)
                .FontColor(PdfTheme.InkMuted)
                .Bold();

            table.Cell()
                .Background(PdfTheme.AccentTint)
                .BorderTop(2).BorderColor(PdfTheme.Accent)
                .PaddingHorizontal(6).PaddingVertical(7)
                .AlignRight()
                .Text(_data.GrandTotal.ToString("N2"))
                .FontSize(PdfTheme.FontBody)
                .FontColor(PdfTheme.Accent)
                .Bold();
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

    /// <summary>Renders a labelled stat card into the supplied container.</summary>
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

    /// <summary>
    /// Renders a pill-style filter chip into an <c>AutoItem</c> row slot.
    /// Must not be preceded by <c>AlignRight</c> — <c>AutoItem</c> has no
    /// bounded width for alignment to resolve against.
    /// </summary>
    private static void FilterChip(RowDescriptor row, string label, string value)
    {
        row.AutoItem()
            .Background(PdfTheme.AccentSoft)
            .Border(1).BorderColor(PdfTheme.Accent)
            .Padding(3).PaddingHorizontal(6)
            .Text(t =>
            {
                t.Span(label + ": ")
                    .FontSize(PdfTheme.FontSmall)
                    .FontColor(PdfTheme.InkMuted);
                t.Span(value)
                    .FontSize(PdfTheme.FontSmall)
                    .FontColor(PdfTheme.AccentDeep)
                    .Bold();
            });
    }
}
