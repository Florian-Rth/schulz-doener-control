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

    // The dashboard's "Gesendete Benachrichtigung" preview sentence. Ordering has no time cutoff, so
    // the sentence makes no time promise — it just rallies the colleagues.
    [Pure]
    public static string BuildOpenDayPreview(string synonym) =>
        $"Achtung Kollegen — heute wird ein „{synonym}\" organisiert! Wer ist dabei?";
}
