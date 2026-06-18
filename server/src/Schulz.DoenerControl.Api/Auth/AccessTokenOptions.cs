namespace Schulz.DoenerControl.Api.Auth;

// The JWT signing material + validation parameters, bound from the Auth:* configuration section.
// Validated non-empty at startup so the app refuses to boot without a real signing key.
public sealed class AccessTokenOptions
{
    public const string SectionKey = "Auth";

    public string JwtSigningKey { get; set; } = string.Empty;

    public string JwtIssuer { get; set; } = string.Empty;

    public string JwtAudience { get; set; } = string.Empty;
}
