using System.Diagnostics.Contracts;
using System.Text.RegularExpressions;
using Schulz.DoenerControl.Application.OrderDays;
using Schulz.DoenerControl.Core.Entities;
using Schulz.DoenerControl.Core.Enums;

namespace Schulz.DoenerControl.Application.Calculators;

// Pulls the Döner-relevant answers out of a line's generic answer payload for the Abholer's counter
// mode. Mirrors the web Konfigurator's rule for which products are a bread-based Döner: the category
// has a single-select `meat` and a multi-select `sauce` field, and the product is no box/plate —
// the menu has no "has bread" flag, so boxes are excluded by name.
public static partial class PrintLineBuildResolver
{
    public const string MeatFieldKey = "meat";
    public const string SauceFieldKey = "sauce";

    // productNames: every name the line is known by (its own and, for a preset, the base item's), so
    // a "Danny-Box" preset is excluded even if its base were named differently.
    [Pure]
    public static PrintLineBuild Resolve(
        CategorySpec? category,
        LineAnswers answers,
        IReadOnlyCollection<string> productNames
    ) =>
        new(
            answers.OptionsFor(MeatFieldKey).FirstOrDefault(),
            [.. answers.OptionsFor(SauceFieldKey)],
            ExtraTextOf(category, answers),
            IsBreadDoener(category, productNames)
        );

    [Pure]
    private static string ExtraTextOf(CategorySpec? category, LineAnswers answers)
    {
        var textField = category?.Fields.FirstOrDefault(field => field.Type == FieldType.Text);
        return textField is null
            ? string.Empty
            : answers.TextFor(textField.Key)?.Trim() ?? string.Empty;
    }

    [Pure]
    private static bool IsBreadDoener(CategorySpec? category, IReadOnlyCollection<string> names)
    {
        if (category is null || names.Any(name => BreadlessName().IsMatch(name)))
            return false;

        return category.Field(MeatFieldKey)?.Type == FieldType.SingleSelect
            && category.Field(SauceFieldKey)?.Type == FieldType.MultiSelect;
    }

    [GeneratedRegex("box|teller", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex BreadlessName();
}
