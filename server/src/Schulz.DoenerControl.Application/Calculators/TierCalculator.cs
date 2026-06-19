using System.Collections.ObjectModel;
using System.Diagnostics.Contracts;
using System.Numerics;
using Schulz.DoenerControl.Core.Enums;

namespace Schulz.DoenerControl.Application.Calculators;

// Ported from the mock's computeTier(MY_HISTORY): 15 Döner-Tiere in priority order, first match
// wins, computed over the user's recent orders. Sauce shares are derived from the [Flags] enum
// rather than German strings (PLAN correction #12). The canonical Markus fixture (garlic ~0.92,
// spicy ~0.42) resolves to 🐺 Der Knoblauch-Wolf.
public static class TierCalculator
{
    private const string PizzaProductId = "pizza";
    private const string DannyProductId = "danny";
    private const string BigProductId = "big";
    private const string BoxProductId = "box";
    private const string DuerumProductId = "duerum";

    // Trigger thresholds — the single source of truth. ComputeTier compares against these constants
    // and the catalogue renders each tier's German Condition from the same values, so no magic
    // number is ever hand-duplicated in a DTO or condition string.
    private const double GarlicHighShare = 0.7;
    private const double SpicyHighShare = 0.7;
    private const double BothHighShare = 0.6;
    private const double AllThreeSauceShare = 0.5;
    private const double NoSauceShare = 0.5;
    private const double BigShare = 0.4;
    private const double DuerumShare = 0.5;
    private const double BoxShare = 0.4;
    private const int MinPizza = 2;
    private const int MinDanny = 2;
    private const int MinPortionCount = 2;
    private const int MinMeatedForLoyalty = 5;
    private const int MinDistinctProducts = 5;
    private const int MinOrdersForHabit = 5;
    private const int MaxDistinctForHabit = 1;

    // Presentation copy, not relational data: emoji/name/tagline/tags in priority order, exactly
    // as the mock's TIER_CATALOG.
    private static readonly ReadOnlyCollection<DoenerTier> CatalogValue = BuildCatalog();

    public static ReadOnlyCollection<DoenerTier> Catalog => CatalogValue;

    [Pure]
    public static DoenerTier ComputeTier(IReadOnlyList<TierOrderInput> history)
    {
        var n = history.Count == 0 ? 1 : history.Count;

        var garlic = ShareWith(history, Sauce.Knoblauch, n);
        var spicy = ShareWith(history, Sauce.Scharf, n);

        var meated = history.Count(o => o.Meat is not null);
        var kalbR = meated == 0 ? 0d : (double)history.Count(o => o.Meat == MeatType.Kalb) / meated;
        var haehnR =
            meated == 0 ? 0d : (double)history.Count(o => o.Meat == MeatType.Haehnchen) / meated;

        var noSauce =
            (double)history.Count(o => o.Kind == ProductKind.Doener && o.Sauces == Sauce.None) / n;
        var allThree = (double)history.Count(o => SauceCount(o.Sauces) >= 3) / n;

        var pizza = CountOf(history, PizzaProductId);
        var danny = CountOf(history, DannyProductId);
        var big = CountOf(history, BigProductId);
        var box = CountOf(history, BoxProductId);
        var duerum = CountOf(history, DuerumProductId);
        var uniq = history.Select(o => o.ProductId).Distinct().Count();

        var count = history.Count;

        if (garlic >= BothHighShare && spicy >= BothHighShare)
            return CatalogValue[0] with { Count = count };
        if (garlic >= GarlicHighShare)
            return CatalogValue[1] with { Count = count };
        if (spicy >= SpicyHighShare)
            return CatalogValue[2] with { Count = count };
        if (pizza >= MinPizza)
            return CatalogValue[3] with { Count = count };
        if (danny >= MinDanny)
            return CatalogValue[4] with { Count = count };
        if (big >= Math.Max(MinPortionCount, n * BigShare))
            return CatalogValue[5] with { Count = count };
        if (kalbR == 1 && meated >= MinMeatedForLoyalty)
            return CatalogValue[6] with { Count = count };
        if (haehnR == 1 && meated >= MinMeatedForLoyalty)
            return CatalogValue[7] with { Count = count };
        if (allThree >= AllThreeSauceShare)
            return CatalogValue[8] with { Count = count };
        if (noSauce >= NoSauceShare)
            return CatalogValue[9] with { Count = count };
        if (duerum >= Math.Max(MinPortionCount, n * DuerumShare))
            return CatalogValue[10] with { Count = count };
        if (box >= Math.Max(MinPortionCount, n * BoxShare))
            return CatalogValue[11] with { Count = count };
        if (uniq >= MinDistinctProducts)
            return CatalogValue[12] with { Count = count };
        if (uniq <= MaxDistinctForHabit && n >= MinOrdersForHabit)
            return CatalogValue[13] with { Count = count };

        return CatalogValue[14] with
        {
            Count = count,
        };
    }

    [Pure]
    private static double ShareWith(IReadOnlyList<TierOrderInput> history, Sauce sauce, int n) =>
        (double)history.Count(o => (o.Sauces & sauce) != 0) / n;

    [Pure]
    private static int CountOf(IReadOnlyList<TierOrderInput> history, string productId) =>
        history.Count(o => o.ProductId == productId);

    [Pure]
    private static int SauceCount(Sauce sauces) => BitOperations.PopCount((uint)sauces);

    private static ReadOnlyCollection<DoenerTier> BuildCatalog()
    {
        var tiers = new[]
        {
            Tier(
                "🦨",
                "Die Bürowaffe",
                "Knoblauch UND scharf, fast immer. Nach dem Mittag wird dein Großraumbüro zur Sperrzone erklärt.",
                $"Knoblauch- UND Schärfe-Anteil jeweils {Percent(BothHighShare)}",
                "Biogefahr",
                "Knobi+Scharf",
                "Evakuierung"
            ),
            Tier(
                "🐺",
                "Der Knoblauch-Wolf",
                "Extra Knobi ist Pflicht. Kollegen halten ab 14 Uhr respektvollen Sicherheitsabstand.",
                $"Knoblauch-Anteil {Percent(GarlicHighShare)}",
                "Knobi: MAX",
                "Rudeltier",
                "Atem 🚫"
            ),
            Tier(
                "🐉",
                "Der Schärfe-Drache",
                "„Extra scharf\" ist deine Grundeinstellung. Die Klospülung läuft längst auf Werks-Notruf.",
                $"Schärfe-Anteil {Percent(SpicyHighShare)}",
                "Scharf 🌶",
                "Feuerfest",
                "Reue: 0"
            ),
            Tier(
                "🍕",
                "Der Pizza-Verräter",
                "Geht zum Dönermann – und bestellt Pizza. Im alten Anatolien wärst du dafür verbannt worden.",
                $"Mindestens {MinPizza} Pizza-Bestellungen",
                "Abtrünnig",
                "Pizza",
                "Schande"
            ),
            Tier(
                "📦",
                "Der Danny-Jünger",
                "Pommes, Fleisch, Soße – kein Salat, kein Brot, keine Reue. Lebt streng nach dem Danny-Kodex.",
                $"Mindestens {MinDanny} Danny-Boxen",
                "Insider",
                "Carb-Kult",
                "Eingeweiht"
            ),
            Tier(
                "🐗",
                "Die Big-Döner-Wildsau",
                "Normale Portionen empfindest du als persönliche Beleidigung. Hunger-Level: betriebsgefährdend.",
                $"Big-Döner-Anteil {Percent(BigShare)} (mindestens {MinPortionCount})",
                "XXL",
                "Maßlos",
                "Respekt"
            ),
            Tier(
                "🦖",
                "Der Kalb-Rex",
                "Hähnchen ist für dich Beilage, kein Fleisch. Vegetarier wittern instinktiv Gefahr.",
                $"Ausschließlich Kalb bei mindestens {MinMeatedForLoyalty} Fleisch-Bestellungen",
                "Team Kalb",
                "Apex",
                "Pures Fleisch"
            ),
            Tier(
                "🐔",
                "Das Angst-Hähnchen",
                "Immer Hähnchen, nie Kalb. Beim Döner so risikofreudig wie bei der Steuererklärung.",
                $"Ausschließlich Hähnchen bei mindestens {MinMeatedForLoyalty} Fleisch-Bestellungen",
                "Team Hähnchen",
                "Vorsichtig",
                "Brav"
            ),
            Tier(
                "🐙",
                "Der Soßen-Messie",
                "Kräuter, Knobi UND scharf – auf alles. „Sich entscheiden\" steht nicht auf deiner Karte.",
                $"Bei {Percent(AllThreeSauceShare)} der Bestellungen alle drei Soßen",
                "Alle Soßen",
                "Chaos",
                "Trieft"
            ),
            Tier(
                "🐭",
                "Die Trockenmaus",
                "Döner fast immer ohne Soße. Entweder eiserne Diät – oder einfach freudlos.",
                $"{Percent(NoSauceShare)} der Döner ohne Soße",
                "Knochentrocken",
                "Spaßbremse",
                "Soße? Nein"
            ),
            Tier(
                "🦅",
                "Der Dürüm-Adler",
                "Schwebt donnerstags pünktlich ein und greift sich den größten Wickel der Werkstatt.",
                $"Dürüm-Anteil {Percent(DuerumShare)} (mindestens {MinPortionCount})",
                "Dürüm",
                "Frühbucher",
                "Greift zu"
            ),
            Tier(
                "🦫",
                "Der Pommes-Biber",
                "Box-Fanatiker. Wo Pommes drin sind, baust du sofort dein Revier.",
                $"Box-Anteil {Percent(BoxShare)} (mindestens {MinPortionCount})",
                "Box",
                "Carb-Loader",
                "Nager"
            ),
            Tier(
                "🐒",
                "Das Chaos-Äffchen",
                "Jede Woche etwas anderes. Eine Speisekarte ist für dich eine Mutprobe.",
                $"Mindestens {MinDistinctProducts} verschiedene Produkte",
                "Wankelmütig",
                "Planlos",
                "Mutig"
            ),
            Tier(
                "🦥",
                "Das Gewohnheits-Faultier",
                "Seit drei Monaten exakt dasselbe. Kreativität erfolgreich nach extern ausgelagert.",
                $"Nur ein Produkt bei mindestens {MinOrdersForHabit} Bestellungen",
                "Stur",
                "Verlässlich",
                "Gähn"
            ),
            Tier(
                "🌯",
                "Der solide Döner-Bürger",
                "Unauffällig, zuverlässig, mittelmäßig – der Beamte unter den Döner-Essern.",
                "Wenn keine andere Regel zutrifft",
                "Solide",
                "Durchschnitt",
                "Korrekt"
            ),
        };

        return new ReadOnlyCollection<DoenerTier>(tiers);
    }

    // Renders a share threshold (0..1) as a German "≥ NN %" condition phrase straight from the
    // comparison constant — the catalogue never hard-codes the percentage as a string literal.
    [Pure]
    private static string Percent(double share) => $"≥ {(int)Math.Round(share * 100)} %";

    private static DoenerTier Tier(
        string emoji,
        string name,
        string tagline,
        string condition,
        string tag1,
        string tag2,
        string tag3
    ) =>
        new(emoji, name, tagline, new ReadOnlyCollection<string>([tag1, tag2, tag3]), condition, 0);
}
