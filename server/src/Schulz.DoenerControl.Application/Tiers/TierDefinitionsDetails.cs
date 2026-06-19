using System.Collections.ObjectModel;
using Schulz.DoenerControl.Application.Calculators;

namespace Schulz.DoenerControl.Application.Tiers;

// The read-only admin view of the Döner-Tier definitions (B4): all 15 tiers in priority order, each
// carrying its emoji/name/tagline/tags and its calculator-derived German trigger condition, plus the
// rolling window length (in days) the tiers are computed over so the admin sees the basis.
public sealed record TierDefinitionsDetails(ReadOnlyCollection<DoenerTier> Tiers, int WindowDays);
