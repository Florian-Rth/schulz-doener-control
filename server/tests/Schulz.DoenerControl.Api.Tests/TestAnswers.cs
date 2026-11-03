using Schulz.DoenerControl.Core.Entities;
using Schulz.DoenerControl.Core.Enums;

namespace Schulz.DoenerControl.Api.Tests;

// Test-only builders for the OrderLine.Answers payload, so the many fixtures that used to set the
// typed Meat/Sauces/PizzaVariant/Extra columns keep expressing the same intent. FromEnums bridges the
// old (MeatType, Sauce) fixtures — the option keys are just the lowercased enum names, matching the
// reserved keys the Tier contract fixes.
internal static class TestAnswers
{
    public static LineAnswers Doener(string meat = "kalb", params string[] sauces) =>
        Build(meat, sauces, variant: null, extra: null);

    public static LineAnswers Pizza(string variant = "salami") =>
        Build(meat: null, sauces: [], variant, extra: null);

    public static LineAnswers FromEnums(MeatType? meat, Sauce sauces, string? extra = null) =>
        Build(MeatKey(meat), SauceKeys(sauces), variant: null, extra);

    public static LineAnswers Build(
        string? meat,
        IReadOnlyList<string> sauces,
        string? variant,
        string? extra
    )
    {
        var fields = new Dictionary<string, AnswerValue>();
        if (meat is not null)
            fields["meat"] = AnswerValue.FromOptions(meat);
        if (sauces.Count > 0)
            fields["sauce"] = AnswerValue.FromOptions([.. sauces]);
        if (variant is not null)
            fields["variant"] = AnswerValue.FromOptions(variant);
        if (!string.IsNullOrEmpty(extra))
            fields["extra"] = AnswerValue.FromText(extra);
        return new LineAnswers(fields);
    }

    private static string? MeatKey(MeatType? meat) =>
        meat switch
        {
            MeatType.Kalb => "kalb",
            MeatType.Haehnchen => "haehnchen",
            MeatType.Gemischt => "gemischt",
            _ => null,
        };

    private static IReadOnlyList<string> SauceKeys(Sauce sauces)
    {
        var keys = new List<string>(3);
        if (sauces.HasFlag(Sauce.Kraeuter))
            keys.Add("kraeuter");
        if (sauces.HasFlag(Sauce.Knoblauch))
            keys.Add("knoblauch");
        if (sauces.HasFlag(Sauce.Scharf))
            keys.Add("scharf");
        return keys;
    }
}
