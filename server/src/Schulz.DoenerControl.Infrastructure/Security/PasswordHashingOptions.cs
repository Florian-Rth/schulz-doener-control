using System.ComponentModel.DataAnnotations;

namespace Schulz.DoenerControl.Infrastructure.Security;

// Argon2id tuning + the server-side pepper, bound from configuration and validated at startup.
// The pepper (Auth:Pepper) is a base64-encoded high-entropy secret that is never stored in the
// database; the cost parameters (PasswordHashing:*) are tunable without a recompile so tests can
// run a deliberately weak profile while production keeps the OWASP-recommended values.
public sealed class PasswordHashingOptions
{
    public const string PepperConfigKey = "Auth:Pepper";
    public const string ParametersConfigSection = "PasswordHashing";

    // Minimum decoded pepper length in bytes. Anything shorter is rejected at startup so the app
    // refuses to boot without a real, high-entropy secret.
    public const int MinimumPepperBytes = 16;

    public const int DefaultMemorySize = 19456;
    public const int DefaultIterations = 2;

    [Required(AllowEmptyStrings = false)]
    public string Pepper { get; set; } = string.Empty;

    [Range(8192, int.MaxValue)]
    public int MemorySize { get; set; } = DefaultMemorySize;

    [Range(1, int.MaxValue)]
    public int Iterations { get; set; } = DefaultIterations;
}
