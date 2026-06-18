using System.Collections.Concurrent;
using Schulz.DoenerControl.Application.Security;

namespace Schulz.DoenerControl.Infrastructure.Security;

// In-memory per-account lockout: five consecutive failures lock the account for fifteen minutes.
// Registered as a singleton so the counter survives across requests for the host's lifetime. The
// clock is injected so tests stay deterministic.
public sealed class LoginLockout : ILoginLockout
{
    private const int MaxFailures = 5;

    private static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(15);

    private readonly ConcurrentDictionary<string, LockoutState> states = new(
        StringComparer.Ordinal
    );
    private readonly TimeProvider timeProvider;

    public LoginLockout(TimeProvider timeProvider)
    {
        this.timeProvider = timeProvider;
    }

    public bool IsLockedOut(string normalizedUsername)
    {
        if (!states.TryGetValue(normalizedUsername, out var state))
            return false;

        return state.LockedUntil is { } until && until > timeProvider.GetUtcNow();
    }

    public void RegisterFailure(string normalizedUsername)
    {
        states.AddOrUpdate(
            normalizedUsername,
            _ => Advance(new LockoutState(0, null)),
            (_, existing) => Advance(existing)
        );
    }

    public void Reset(string normalizedUsername) => states.TryRemove(normalizedUsername, out _);

    private LockoutState Advance(LockoutState existing)
    {
        var failures = existing.Failures + 1;
        var lockedUntil =
            failures >= MaxFailures
                ? timeProvider.GetUtcNow() + LockoutDuration
                : existing.LockedUntil;
        return new LockoutState(failures, lockedUntil);
    }

    private sealed record LockoutState(int Failures, DateTimeOffset? LockedUntil);
}
