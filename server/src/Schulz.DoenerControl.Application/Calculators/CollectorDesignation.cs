using System.Diagnostics.Contracts;

namespace Schulz.DoenerControl.Application.Calculators;

// Reconciles the day's single designated collector (OrderDay.CollectorUserId) with a participant's
// pickup state. A pickup with no current collector becomes it (the common single-pickup office flow);
// releasing pickup vacates the designation only if the releaser was the collector. Re-designating to
// another pickup stays an explicit action (SetCollector).
public static class CollectorDesignation
{
    [Pure]
    public static Guid? Reconcile(Guid? currentCollector, Guid participantUserId, bool isPickup) =>
        isPickup ? currentCollector ?? participantUserId
        : currentCollector == participantUserId ? null
        : currentCollector;
}
