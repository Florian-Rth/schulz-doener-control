using System.Diagnostics.Contracts;
using Schulz.DoenerControl.Core.Enums;

namespace Schulz.DoenerControl.Application.Calculators;

// The Bestellschluss / edit-window rule as a pure predicate: a participant may add, edit or
// withdraw an order only while the day is Open, ordering has not been manually locked, AND the
// current instant is at or before the cutoff. now == cutoff is still allowed; cutoff + any tick is
// rejected. A set orderingClosedAt locks ordering even before the time cutoff. The enforcement (and
// its HTTP mapping) lives in the service; this is just the rule.
public static class OrderWindow
{
    [Pure]
    public static bool CanOrder(
        OrderDayStatus status,
        DateTimeOffset? orderingClosedAt,
        DateTimeOffset cutoff,
        DateTimeOffset now
    ) => status == OrderDayStatus.Open && orderingClosedAt is null && now <= cutoff;
}
