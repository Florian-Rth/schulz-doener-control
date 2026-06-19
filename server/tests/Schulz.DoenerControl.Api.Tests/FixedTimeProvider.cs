namespace Schulz.DoenerControl.Api.Tests;

// A deterministic TimeProvider for the integration harness. The real production code resolves
// "now", the business day, and the order cutoff from the injected TimeProvider; the harness pins
// it here so time-dependent behaviour (order window, 90-day tier window, leaderboard year, token
// expiry) never depends on the wall clock.
//
// The instant is a Thursday morning before the 11:30 Europe/Berlin cutoff: 08:00 Berlin in winter
// (offset +1) == 07:00Z, on 2026-01-15 (a Thursday). 08:00 < 11:30 so the order window is open, and
// Thursday is the canonical Döner-Tag. Tests that seed time-relative data must anchor on Instant
// (not DateTimeOffset.UtcNow) so the seeded instants and the server clock agree.
public sealed class FixedTimeProvider : TimeProvider
{
    public static readonly DateTimeOffset Instant = new(
        2026,
        1,
        15,
        8,
        0,
        0,
        TimeSpan.FromHours(1)
    );

    public override DateTimeOffset GetUtcNow() => Instant;
}
