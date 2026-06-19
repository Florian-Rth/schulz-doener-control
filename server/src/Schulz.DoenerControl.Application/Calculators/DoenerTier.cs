using System.Collections.ObjectModel;

namespace Schulz.DoenerControl.Application.Calculators;

// A computed (or catalogued) Döner-Tier: the playful animal with its German tagline + tag chips.
// Count carries the number of orders the tier was computed over (the mock's T(...).count); it is
// zero for catalog entries. Condition is the human-readable German description of the trigger rule
// that earns this tier, rendered by the calculator from the very thresholds ComputeTier compares
// against (single source of truth — no magic number is hand-duplicated elsewhere).
public sealed record DoenerTier(
    string Emoji,
    string Name,
    string Tagline,
    ReadOnlyCollection<string> Tags,
    string Condition,
    int Count
);
