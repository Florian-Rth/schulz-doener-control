namespace Schulz.DoenerControl.Application.OrderDays;

// Outcome of opening a day: the open-day projection plus how many colleagues were notified.
// NotifiedColleagueCount is 0 when the day already existed (idempotent re-open notifies nobody).
public sealed record OpenDayResult(OrderDayDetails Day, int NotifiedColleagueCount);
