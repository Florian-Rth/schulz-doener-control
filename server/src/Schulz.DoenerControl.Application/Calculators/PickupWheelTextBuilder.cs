using System.Collections.ObjectModel;
using System.Diagnostics.Contracts;

namespace Schulz.DoenerControl.Application.Calculators;

// The Glücksrad's push texts. The verdict lines are a random pool so the ritual stays fresh; the
// day's Döner synonym keeps the running joke of the open-day notification going.
public static class PickupWheelTextBuilder
{
    public const string Title = "🎡 Abholer-Glücksrad";

    private static readonly ReadOnlyCollection<string> VerdictTemplates = new([
        "Kein Freiwilliger, Chefs? Das Rad hat entschieden: {NAME} holt heute die {SYNONYM}!",
        "Das Schicksal hat gesprochen: {NAME} fährt die {SYNONYM} abholen. Keine Widerrede!",
        "Rad gedreht, Würfel gefallen: {NAME} ist heute der Packesel für die {SYNONYM}.",
        "Glückwunsch, {NAME}! Du hast die Abhol-Lotterie gewonnen. Die {SYNONYM} wartet.",
    ]);

    public static ReadOnlyCollection<string> Verdicts => VerdictTemplates;

    [Pure]
    public static string BuildVerdict(string template, string chosenName, string synonym) =>
        template
            .Replace("{NAME}", chosenName, StringComparison.Ordinal)
            .Replace("{SYNONYM}", synonym, StringComparison.Ordinal);

    [Pure]
    public static string BuildRespin(string excusedName, string chosenName) =>
        $"{excusedName} hatte einen SEHR wichtigen Grund. Das Rad hat neu gedreht: {chosenName} holt ab!";
}
