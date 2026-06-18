namespace Schulz.DoenerControl.Api.Tests;

// Fixed, deterministic test secrets and tuning values for the integration harness.
// These mirror the production configuration keys with safe test-only values so the
// real wiring paths run without ever needing a production secret.
public static class TestConfig
{
    // 32-byte base64 secrets so the real Argon2id KnownSecret / JWT signing paths run.
    public const string Pepper = "dGVzdC1wZXBwZXItMzItYnl0ZXMtYmFzZTY0LXNlY3JldA==";
    public const string JwtSigningKey = "dGVzdC1qd3Qtc2lnbmluZy1rZXktMzItYnl0ZXMtbG9uZyE=";
    public const string JwtIssuer = "doener-test";
    public const string JwtAudience = "doener-test";
    public const string OrderCutoffLocalTime = "11:30";

    // Deliberately weak Argon2id parameters to keep the red-green loop fast.
    public const string PasswordHashingMemorySize = "8192";
    public const string PasswordHashingIterations = "1";
}
