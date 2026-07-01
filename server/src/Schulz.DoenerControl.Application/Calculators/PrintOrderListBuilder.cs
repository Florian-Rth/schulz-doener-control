using System.Diagnostics.Contracts;
using Schulz.DoenerControl.Application.OrderDays;

namespace Schulz.DoenerControl.Application.Calculators;

// Raw input to the sheet builder: one persisted order line with its resolved labels and the menu
// SortOrder that buckets it by article type. The caller (the OrderDay projection) resolves the
// product name, meat/variant label and sort order before handing lines here.
public sealed record PrintLineInput(
    int SortOrder,
    string Section,
    string PersonName,
    string ProductLabel,
    string Description,
    int Quantity,
    int LineTotalCents,
    bool IsPickup
);

// Turns the day's raw order lines into the Abholer's order sheet: sorts every line into article-type
// order (menu SortOrder, then product label, then description, then person) so the shop can be worked
// group by group, numbers them 1..N in that order (the number goes on each bag at handoff), and rolls
// identical items up into a "n× …" shop summary. Pure — the caller resolves labels + sort keys first.
public static class PrintOrderListBuilder
{
    // Mirrors OrderLabelBuilder's empty-description fallback: kept out of the grouped summary label so
    // a plain item reads "Döner Kalb", not "Döner Kalb · Standard".
    private const string StandardDescription = "Standard";

    [Pure]
    public static OrderPrintList Build(IReadOnlyList<PrintLineInput> lines)
    {
        // Section (product name) is a sort key BEFORE ProductLabel so lines of one article type are
        // always contiguous — the sheet's section headers rely on that, and two products can legally
        // share a menu SortOrder (it is admin-settable, not unique).
        var ordered = lines
            .OrderBy(line => line.SortOrder)
            .ThenBy(line => line.Section, StringComparer.OrdinalIgnoreCase)
            .ThenBy(line => line.ProductLabel, StringComparer.OrdinalIgnoreCase)
            .ThenBy(line => line.Description, StringComparer.OrdinalIgnoreCase)
            .ThenBy(line => line.PersonName, StringComparer.OrdinalIgnoreCase)
            .ToList();

        var numbered = ordered
            .Select(
                (line, index) =>
                    new PrintLineSummary(
                        index + 1,
                        line.Section,
                        line.PersonName,
                        line.ProductLabel,
                        line.Description,
                        line.Quantity,
                        line.LineTotalCents,
                        MoneyFormatter.ToGermanString(line.LineTotalCents),
                        line.IsPickup
                    )
            )
            .ToList();

        var summary = ordered
            .GroupBy(line => (line.SortOrder, line.Section, line.ProductLabel, line.Description))
            .OrderBy(group => group.Key.SortOrder)
            .ThenBy(group => group.Key.Section, StringComparer.OrdinalIgnoreCase)
            .ThenBy(group => group.Key.ProductLabel, StringComparer.OrdinalIgnoreCase)
            .ThenBy(group => group.Key.Description, StringComparer.OrdinalIgnoreCase)
            .Select(group => new PrintSummaryLine(
                SummaryLabel(group.Key.ProductLabel, group.Key.Description),
                group.Sum(line => line.Quantity)
            ))
            .ToList();

        return new OrderPrintList(numbered, summary);
    }

    [Pure]
    private static string SummaryLabel(string productLabel, string description) =>
        string.IsNullOrWhiteSpace(description) || description == StandardDescription
            ? productLabel
            : $"{productLabel} · {description}";
}
