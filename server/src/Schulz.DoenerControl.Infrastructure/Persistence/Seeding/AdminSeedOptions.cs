namespace Schulz.DoenerControl.Infrastructure.Persistence.Seeding;

// The single bootstrap administrator the app seeds on first run. Bound from the "Auth:AdminSeed"
// configuration section. The password is never a C# constant — it comes from configuration so
// production can override it via an environment variable (Auth__AdminSeed__Password) and dev gets a
// throwaway value from appsettings.Development.json. The admin then creates everyone else via the
// user-management endpoints, so this is the only seeded account.
public sealed class AdminSeedOptions
{
    public const string ConfigSection = "Auth:AdminSeed";

    public const string DefaultUsername = "admin";
    public const string DefaultDisplayName = "Chef Admin";
    public const string DefaultAvatarColorHex = "#C90023";

    public string Username { get; set; } = DefaultUsername;

    public string Password { get; set; } = string.Empty;

    public string DisplayName { get; set; } = DefaultDisplayName;

    public string AvatarColorHex { get; set; } = DefaultAvatarColorHex;
}
