namespace Schulz.DoenerControl.Application.Security;

// CurrentPassword is null when the caller is in the forced first-login change (MustChangePassword
// set); the service then skips current-password verification. On the self-service path it is
// required and verified.
public sealed record ChangePasswordCommand(
    Guid CallerUserId,
    string? CurrentPassword,
    string NewPassword
);
