namespace Schulz.DoenerControl.Application.OrderDays;

// Manually locks ordering for a day ("Bestellung schließen") without closing the whole day. Only the
// designated collector may do this; the caller is the authenticated user.
public sealed record CloseOrderingCommand(Guid CallerUserId, Guid OrderDayId);
