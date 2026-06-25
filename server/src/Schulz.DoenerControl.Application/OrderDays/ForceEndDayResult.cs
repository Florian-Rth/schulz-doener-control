namespace Schulz.DoenerControl.Application.OrderDays;

// Outcome of an admin force-end (scrap-and-end): the closed-day projection plus how many orders were
// discarded. No debts are created — an aborted day leaves nobody owing anything.
public sealed record ForceEndDayResult(OrderDayDetails Day, int RemovedOrders);
