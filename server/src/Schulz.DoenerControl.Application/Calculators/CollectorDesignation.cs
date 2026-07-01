using System.Diagnostics.Contracts;

namespace Schulz.DoenerControl.Application.Calculators;

// Reconciles the day's single designated collector (OrderDay.CollectorUserId) with a participant's
// pickup state. Claiming pickup makes the participant THE collector unconditionally — a take-over
// that displaces any prior collector. This is the single unified rule behind every "ich hole ab"
// entry point (the order-form toggle and the dashboard button now behave identically; there are no
// longer two collector-designation systems). Releasing pickup vacates the designation only if the
// releaser was the collector.
public static class CollectorDesignation
{
    [Pure]
    public static Guid? Reconcile(Guid? currentCollector, Guid participantUserId, bool isPickup) =>
        isPickup ? participantUserId
        : currentCollector == participantUserId ? null
        : currentCollector;
}
