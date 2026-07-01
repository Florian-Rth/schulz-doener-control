namespace Schulz.DoenerControl.Application.OrderDays;

// One package line on the Abholer's order sheet: a single order line, numbered in the sheet's
// article-type order (Döner first, then Dürüm, then …, then Pizza — the menu's SortOrder) so the shop
// can be worked group by group, and tagged with who it belongs to so the number can be written on the
// bag at handoff.
public sealed record PrintLineSummary(
    int Number,
    // The article type this line groups under on the sheet (the product name — "Döner", "Dürüm",
    // "Pizza" …), so the UI can print a section header per type.
    string Section,
    string PersonName,
    string ProductLabel,
    string Description,
    int Quantity,
    int LineTotalCents,
    string LineTotalLabel,
    bool IsPickup
);

// A "für die Theke" roll-up: identical items across everyone folded into one "n× …" line, for reading
// the whole order out at the shop quickly.
public sealed record PrintSummaryLine(string Label, int Quantity);

// The Abholer's printable / e-mailable order sheet: the numbered per-package lines (in article-type
// order) plus the grouped shop summary. Built once on the server so the on-screen list, the printed
// sheet and the e-mailed PDF are always identical.
public sealed record OrderPrintList(
    IReadOnlyList<PrintLineSummary> Lines,
    IReadOnlyList<PrintSummaryLine> Summary
);
