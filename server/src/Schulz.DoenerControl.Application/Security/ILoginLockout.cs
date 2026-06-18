namespace Schulz.DoenerControl.Application.Security;

// Per-account brute-force lockout. The schema carries no failed-count/lockout columns, so this is
// kept as a process-local counter keyed by normalized username — sufficient for a 13-person office
// and complementary to the per-IP Throttle on the login endpoint. Returns a generic locked state;
// the endpoint never discloses lockout vs bad-password to the caller.
public interface ILoginLockout
{
    bool IsLockedOut(string normalizedUsername);

    void RegisterFailure(string normalizedUsername);

    void Reset(string normalizedUsername);
}
