namespace Schulz.DoenerControl.Application.Leaderboards;

// Input for the per-year Döner-Bestenliste: the calendar year to rank and the authenticated caller
// whose row is flagged and whose gap to the next-higher rank is surfaced. CallerUserId comes from
// the validated JWT, never from the request body.
public sealed record GetLeaderboardQuery(int Year, Guid CallerUserId);
