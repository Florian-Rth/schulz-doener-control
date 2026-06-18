namespace Schulz.DoenerControl.Api.Auth;

// Canonical claim type names embedded in the access JWT. Kept minimal: no PayPal handle or PII
// beyond the display name. sub carries the user id; the rest drive greeting, role checks, and the
// forced-change gate without a database round-trip on every request.
public static class AuthClaims
{
    public const string Subject = "sub";
    public const string Username = "name";
    public const string DisplayName = "display_name";
    public const string Role = "role";
    public const string MustChangePassword = "must_change";
}
