using System.Collections.ObjectModel;

namespace Schulz.DoenerControl.Application.Calculators;

// A computed (or catalogued) Döner-Tier: the playful animal with its German tagline + tag chips.
// Count carries the number of orders the tier was computed over (the mock's T(...).count); it is
// zero for catalog entries.
public sealed record DoenerTier(
    string Emoji,
    string Name,
    string Tagline,
    ReadOnlyCollection<string> Tags,
    int Count
);
