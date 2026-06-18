using System.Collections.ObjectModel;
using System.Diagnostics.Contracts;

namespace Schulz.DoenerControl.Application.Calculators;

// Builds the open-day notification text. The day's absurd Döner-synonym is chosen and stored when
// the day opens; this renders the German push sentence the mock shows in its toast.
public static class PushTextBuilder
{
    private static readonly ReadOnlyCollection<string> SynonymsValue = new([
        "Drehspieß-Tasche",
        "Osmanischer Fleischeimer",
        "Fleisch-Rucksack",
        "Donatello",
        "Rindfleisch-Knoppers",
        "Drehmoment-Mäppchen",
        "Anatolische Fleischbombe",
        "Klappkatze",
    ]);

    public static ReadOnlyCollection<string> Synonyms => SynonymsValue;

    [Pure]
    public static string BuildOpenDayBody(string synonym) =>
        $"Heute wird ein {synonym} organisiert! 🌯";

    // The dashboard's "Gesendete Benachrichtigung" preview sentence, parameterized by the day's
    // cutoff label (e.g. "11:30 Uhr"). Mirrors the mock's notifText.
    [Pure]
    public static string BuildOpenDayPreview(string synonym, string cutoffLabel) =>
        $"Achtung Kollegen — heute wird ein „{synonym}\" organisiert! "
        + $"Bestellschluss {cutoffLabel}. Wer ist dabei?";
}
