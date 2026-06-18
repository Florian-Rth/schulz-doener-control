namespace Schulz.DoenerControl.Application.Security;

public sealed record ChangePasswordCommand(
    Guid CallerUserId,
    string CurrentPassword,
    string NewPassword
);
