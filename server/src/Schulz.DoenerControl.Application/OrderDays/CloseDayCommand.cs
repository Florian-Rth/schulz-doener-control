namespace Schulz.DoenerControl.Application.OrderDays;

// Manually closes a Döner-Tag. The caller is the authenticated user; debt generation hangs off the
// close transition and is filled in by a later feature.
public sealed record CloseDayCommand(Guid CallerUserId, Guid OrderDayId);
