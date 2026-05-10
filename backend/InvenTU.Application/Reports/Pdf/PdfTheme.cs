namespace InvenTU.Application.Reports.Pdf;

/// <summary>
/// Centralised design tokens for InvenTU PDF reports.
/// All colour values are derived directly from the application's
/// bone-paper / safety-orange theme palette so that printed reports
/// remain visually consistent with the web UI.
/// </summary>
internal static class PdfTheme
{
    // Backgrounds
    /// <summary>Primary page background — warm off-white paper.</summary>
    public const string BgPaper = "#fbf9f3";

    /// <summary>Slightly darker surface used for alternate table rows and cards.</summary>
    public const string BgSunk = "#e8e3d8";

    // Typography
    /// <summary>Primary text colour — near-black warm ink.</summary>
    public const string Ink = "#14110b";

    /// <summary>Secondary text colour — medium warm brown.</summary>
    public const string InkMuted = "#6b6457";

    /// <summary>Tertiary text colour — light warm grey, used for hints and captions.</summary>
    public const string InkSubtle = "#9a9384";

    // Rules / Borders
    /// <summary>Standard horizontal rule and table border colour.</summary>
    public const string Rule = "#ddd5c4";

    /// <summary>Heavier rule used for section separators.</summary>
    public const string RuleStrong = "#b8af9b";

    // Accent — safety orange
    /// <summary>Primary brand accent colour used for highlights and totals.</summary>
    public const string Accent = "#e85a1a";

    /// <summary>Darker shade of accent for text on light backgrounds.</summary>
    public const string AccentDeep = "#b8420f";

    /// <summary>Muted accent background for filter chips.</summary>
    public const string AccentSoft = "#f7d9c4";

    /// <summary>Very light accent tint for grand-total rows and filter bars.</summary>
    public const string AccentTint = "#fbe9d9";

    // Status colours
    /// <summary>Positive / success green.</summary>
    public const string Ok = "#2f7a52";

    /// <summary>Muted positive background.</summary>
    public const string OkSoft = "#d2e8db";

    /// <summary>Warning amber.</summary>
    public const string Warn = "#b87d10";

    /// <summary>Muted warning background.</summary>
    public const string WarnSoft = "#f3e3bc";

    /// <summary>Critical / danger red.</summary>
    public const string Crit = "#b3331e";

    /// <summary>Muted critical background.</summary>
    public const string CritSoft = "#f1cfc6";

    // Shell / Header bar
    /// <summary>Dark charcoal background used for the page header band.</summary>
    public const string ShellBg = "#14110b";

    /// <summary>Off-white text that sits on the dark shell background.</summary>
    public const string ShellInk = "#f1ede5";

    /// <summary>Muted text colour within the shell (captions, sub-labels).</summary>
    public const string ShellMuted = "#8a8170";

    // Font sizes (pt)
    /// <summary>Report title in the header band.</summary>
    public const float FontTitle = 18f;

    /// <summary>Section headings and card labels.</summary>
    public const float FontSubtitle = 11f;

    /// <summary>Standard body / table-cell text.</summary>
    public const float FontBody = 9f;

    /// <summary>Small labels, captions, and filter chips.</summary>
    public const float FontSmall = 7.5f;

    /// <summary>Table column headers.</summary>
    public const float FontTableHead = 8f;

    /// <summary>Page footer text.</summary>
    public const float FontFooter = 7f;

    /// <summary>Grand-total / hero numeric values.</summary>
    public const float FontHero = 20f;
}
