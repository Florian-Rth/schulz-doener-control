namespace Schulz.DoenerControl.Application.OrderDays;

// Outcome of closing a day: the closed-day projection plus how many debts the close created.
// DebtsCreated is 0 until the debt-generation feature hangs its logic off the close transition.
public sealed record CloseDayResult(OrderDayDetails Day, int DebtsCreated);
