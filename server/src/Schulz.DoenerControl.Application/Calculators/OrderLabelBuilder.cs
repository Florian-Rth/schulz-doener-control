using System.Diagnostics.Contracts;
using Schulz.DoenerControl.Core.Entities;
using Schulz.DoenerControl.Core.Enums;

namespace Schulz.DoenerControl.Application.Calculators;

// Renders a line's human labels generically from its category spec + answers, replacing the old
// kind/meat/sauce-specific builder. The product label is the resolved product NAME — for a preset the
// caller resolves it to the base item's name first, so the joke name (e.g. "Danny-Box") never reaches
// the kitchen. The description joins the labels of the selected options (fields in category order,
// options in field order) and the free-text answers with " · ", falling back to "Standard".
public static class OrderLabelBuilder
{
    private const string StandardLabel = "Standard";
    private const string Separator = " · ";

    // productName must already be resolved to the base item's name for presets.
    [Pure]
    public static string BuildProductLabel(string productName) => productName;

    [Pure]
    public static string BuildDescription(CategorySpec? category, LineAnswers answers)
    {
        if (category is null)
            return StandardLabel;

        var parts = new List<string>();
        foreach (var field in category.Fields)
        {
            if (field.Type == FieldType.Text)
            {
                var text = answers.TextFor(field.Key);
                if (!string.IsNullOrWhiteSpace(text))
                    parts.Add(text.Trim());
            }
            else
            {
                foreach (var optionKey in answers.OptionsFor(field.Key))
                {
                    var label = field.Option(optionKey)?.Label;
                    if (!string.IsNullOrWhiteSpace(label))
                        parts.Add(label);
                }
            }
        }

        return parts.Count == 0 ? StandardLabel : string.Join(Separator, parts);
    }
}
