namespace Schulz.DoenerControl.Application.Users;

// A colleague self-registering through the printed QR-code flow. Unlike admin provisioning, the
// caller picks their own password (accepted here as plaintext, hashed by the service), so there is
// no forced first-login change. The role is never client-selectable: the service hard-codes
// Employee. SecretKey is the optional shared secret from the QR-code URL: required only when the
// runtime registration mode is SecretKeyOnly, ignored otherwise.
public sealed record SelfRegisterCommand(
    string Username,
    string DisplayName,
    string? PayPalHandle,
    string? WorkEmail,
    string Password,
    string? SecretKey
);
