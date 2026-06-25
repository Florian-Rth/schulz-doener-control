namespace Schulz.DoenerControl.Application.OrderDays;

// Manually closes a Döner-Tag. The caller is the authenticated user; debt generation hangs off the
// close transition. Only the designated collector may close (an admin scrap-and-end is the separate
// ForceEnd action, which discards orders instead of crystallizing debts).
public sealed record CloseDayCommand(Guid CallerUserId, Guid OrderDayId);
