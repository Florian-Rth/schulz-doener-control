namespace Schulz.DoenerControl.Infrastructure;

// Configuration for public self-registration. InviteCode is the optional shared secret embedded in
// the printed QR-code URL: when set, the anonymous register endpoint requires a matching code,
// closing the open-account-creation hole. When null/blank, registration stays open (the default,
// so local/LAN dev is unaffected).
public sealed class RegistrationOptions
{
    public const string InviteCodeConfigKey = "Auth:RegistrationInviteCode";

    public string? InviteCode { get; set; }
}
