using System.Diagnostics.Contracts;
using Schulz.DoenerControl.Core.Enums;

namespace Schulz.DoenerControl.Application.Calculators;

// The Bestellschluss / edit-window rule as a pure predicate: a participant may add, edit or
// withdraw an order only while the day is Open AND ordering has not been manually locked. There is
// no time cutoff — ordering stays open indefinitely until the designated collector locks it
// (OrderingClosedAt is set) or the day is Closed. The enforcement (and its HTTP mapping) lives in
// the service; this is just the rule.
public static class OrderWindow
{
    [Pure]
    public static bool CanOrder(OrderDayStatus status, DateTimeOffset? orderingClosedAt) =>
        status == OrderDayStatus.Open && orderingClosedAt is null;
}
