namespace Schulz.DoenerControl.Application.OrderDays;

// Opens today's Döner-Tag. The opener is resolved by the endpoint from the authenticated caller;
// the service picks the synonym and resolves the cutoff instant itself.
public sealed record OpenDayCommand(Guid CallerUserId);
