using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Application.Email;

// Mails the day's order list as a PDF to the caller's stored work email; returns the address it went
// to on success. Guards in order: SMTP configured, day exists and is open, caller is the Abholer or
// an admin, caller has a work email. Authorization mirrors ForceEnd — the endpoint passes the
// caller's admin-ness.
public interface IOrderListMailService
{
    Task<Result<string>> SendDayListToCallerAsync(
        Guid callerId,
        bool callerIsAdmin,
        Guid orderDayId,
        CancellationToken ct
    );
}
