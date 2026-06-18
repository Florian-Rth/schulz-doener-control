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

        if (garlic >= 0.6 && spicy >= 0.6)
            return CatalogValue[0] with { Count = count };
        if (garlic >= 0.7)
            return CatalogValue[1] with { Count = count };
        if (spicy >= 0.7)
            return CatalogValue[2] with { Count = count };
        if (pizza >= 2)
            return CatalogValue[3] with { Count = count };
        if (danny >= 2)
            return CatalogValue[4] with { Count = count };
        if (big >= Math.Max(2, n * 0.4))
            return CatalogValue[5] with { Count = count };
        if (kalbR == 1 && meated >= 5)
            return CatalogValue[6] with { Count = count };
        if (haehnR == 1 && meated >= 5)
            return CatalogValue[7] with { Count = count };
        if (allThree >= 0.5)
            return CatalogValue[8] with { Count = count };
        if (noSauce >= 0.5)
            return CatalogValue[9] with { Count = count };
        if (duerum >= Math.Max(2, n * 0.5))
            return CatalogValue[10] with { Count = count };
        if (box >= Math.Max(2, n * 0.4))
            return CatalogValue[11] with { Count = count };
        if (uniq >= 5)
            return CatalogValue[12] with { Count = count };
        if (uniq <= 1 && n >= 5)
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
                "Biogefahr",
                "Knobi+Scharf",
                "Evakuierung"
            ),
            Tier(
                "🐺",
                "Der Knoblauch-Wolf",
                "Extra Knobi ist Pflicht. Kollegen halten ab 14 Uhr respektvollen Sicherheitsabstand.",
                "Knobi: MAX",
                "Rudeltier",
                "Atem 🚫"
            ),
            Tier(
                "🐉",
                "Der Schärfe-Drache",
                "„Extra scharf\" ist deine Grundeinstellung. Die Klospülung läuft längst auf Werks-Notruf.",
                "Scharf 🌶",
                "Feuerfest",
                "Reue: 0"
            ),
            Tier(
                "🍕",
                "Der Pizza-Verräter",
                "Geht zum Dönermann – und bestellt Pizza. Im alten Anatolien wärst du dafür verbannt worden.",
                "Abtrünnig",
                "Pizza",
                "Schande"
            ),
            Tier(
                "📦",
                "Der Danny-Jünger",
                "Pommes, Fleisch, Soße – kein Salat, kein Brot, keine Reue. Lebt streng nach dem Danny-Kodex.",
                "Insider",
                "Carb-Kult",
                "Eingeweiht"
            ),
            Tier(
                "🐗",
                "Die Big-Döner-Wildsau",
                "Normale Portionen empfindest du als persönliche Beleidigung. Hunger-Level: betriebsgefährdend.",
                "XXL",
                "Maßlos",
                "Respekt"
            ),
            Tier(
                "🦖",
                "Der Kalb-Rex",
                "Hähnchen ist für dich Beilage, kein Fleisch. Vegetarier wittern instinktiv Gefahr.",
                "Team Kalb",
                "Apex",
                "Pures Fleisch"
            ),
            Tier(
                "🐔",
                "Das Angst-Hähnchen",
                "Immer Hähnchen, nie Kalb. Beim Döner so risikofreudig wie bei der Steuererklärung.",
                "Team Hähnchen",
                "Vorsichtig",
                "Brav"
            ),
            Tier(
                "🐙",
                "Der Soßen-Messie",
                "Kräuter, Knobi UND scharf – auf alles. „Sich entscheiden\" steht nicht auf deiner Karte.",
                "Alle Soßen",
                "Chaos",
                "Trieft"
            ),
            Tier(
                "🐭",
                "Die Trockenmaus",
                "Döner fast immer ohne Soße. Entweder eiserne Diät – oder einfach freudlos.",
                "Knochentrocken",
                "Spaßbremse",
                "Soße? Nein"
            ),
            Tier(
                "🦅",
                "Der Dürüm-Adler",
                "Schwebt donnerstags pünktlich ein und greift sich den größten Wickel der Werkstatt.",
                "Dürüm",
                "Frühbucher",
                "Greift zu"
            ),
            Tier(
                "🦫",
                "Der Pommes-Biber",
                "Box-Fanatiker. Wo Pommes drin sind, baust du sofort dein Revier.",
                "Box",
                "Carb-Loader",
                "Nager"
            ),
            Tier(
                "🐒",
                "Das Chaos-Äffchen",
                "Jede Woche etwas anderes. Eine Speisekarte ist für dich eine Mutprobe.",
                "Wankelmütig",
                "Planlos",
                "Mutig"
            ),
            Tier(
                "🦥",
                "Das Gewohnheits-Faultier",
                "Seit drei Monaten exakt dasselbe. Kreativität erfolgreich nach extern ausgelagert.",
                "Stur",
                "Verlässlich",
                "Gähn"
            ),
            Tier(
                "🌯",
                "Der solide Döner-Bürger",
                "Unauffällig, zuverlässig, mittelmäßig – der Beamte unter den Döner-Essern.",
                "Solide",
                "Durchschnitt",
                "Korrekt"
            ),
        };

        return new ReadOnlyCollection<DoenerTier>(tiers);
    }

    private static DoenerTier Tier(
        string emoji,
        string name,
        string tagline,
        string tag1,
        string tag2,
        string tag3
    ) => new(emoji, name, tagline, new ReadOnlyCollection<string>([tag1, tag2, tag3]), 0);
}
