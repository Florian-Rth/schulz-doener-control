namespace Schulz.DoenerControl.Application.Users;

// The result of provisioning (create) or re-provisioning (reset-password) an account. The
// temporary password is returned EXACTLY ONCE here: it is never stored in plaintext and cannot be
// recovered later, so the admin must hand it over immediately.
public sealed record ProvisionedUserDetails(Guid UserId, string Username, string TemporaryPassword);
