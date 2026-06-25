using Microsoft.Extensions.DependencyInjection;
using Schulz.DoenerControl.Application.Security;
using Schulz.DoenerControl.Core.Entities;
using Schulz.DoenerControl.Core.Enums;
using Schulz.DoenerControl.Infrastructure.Persistence;
using Schulz.DoenerControl.Infrastructure.Persistence.Seeding;

namespace Schulz.DoenerControl.Api.Tests;

// Explicit, reusable test-account seeding, decoupled from the production bootstrap-admin seed. Each
// account is written straight to the DbContext with a real Argon2id hash from the registered hasher
// so credentials verify through the exact production login path.
//
// The production seeder now provisions a single admin; the integration tests instead seed the small
// cast of named users their scenarios act on. SeedStandardTestUsersAsync reproduces that cast (a
// verified admin "Chef" plus a handful of forced-change colleagues) so the bulk of the suite seeds
// it once per fixture, while a test that needs a bespoke account uses SeedUserAsync directly.
internal static class TestSeeding
{
    // The verified admin "Chef": MustChangePassword=false so tests act immediately, with a PayPal
    // handle seeded so the pay-button assertions have a link to reconstruct. The DB stores the bare
    // handle; ChefPayPalLink is the user-facing base link the read-paths reconstruct from it.
    public const string ChefUsername = "m.wagner";
    public const string ChefPassword = "doener-dev-2026";
    public const string ChefDisplayName = "Markus Wagner";
    public const string ChefPayPalHandle = "MarkusWagnerHB";
    public const string ChefPayPalLink = "https://paypal.me/" + ChefPayPalHandle;

    // Every freshly-provisioned colleague gets this initial password and is forced to change it on
    // first login (MustChangePassword=true), exactly as a real account would be.
    public const string InitialColleaguePassword = "Schulz-Start!";

    private static readonly IReadOnlyList<TestUser> StandardColleagues = new[]
    {
        new TestUser("l.brandt", "Lukas Brandt", "#00728E", "LukasBrandtHB"),
        new TestUser("s.yilmaz", "Sara Yılmaz", "#ED701C", "SaraYHB"),
        new TestUser("t.klein", "Tobias Klein", "#45B8A1", null),
        new TestUser("a.schaefer", "Anna Schäfer", "#7B4FB0", null),
        new TestUser("j.hoffmann", "Jonas Hoffmann", "#2E7D32", null),
        new TestUser("n.fischer", "Nele Fischer", "#C2185B", null),
        new TestUser("d.koch", "David Koch", "#1565C0", null),
        new TestUser("p.weber", "Pia Weber", "#00897B", null),
        new TestUser("f.richter", "Felix Richter", "#5D4037", null),
        new TestUser("m.bauer", "Mira Bauer", "#F9A825", null),
        new TestUser("e.wolf", "Erik Wolf", "#455A64", null),
        new TestUser("h.neumann", "Hanna Neumann", "#8E24AA", null),
    };

    // The menu used to ride in on the migration via HasData; it is now planted at runtime by
    // MenuSeeder. The harness applies only the migration (MigrateAsync, no production seed), so it
    // seeds the canonical menu itself — exactly as production does through DatabaseSeeder.
    public static async Task SeedMenuAsync(
        this IServiceProvider services,
        CancellationToken ct = default
    )
    {
        using var scope = services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var menuSeeder = new MenuSeeder(database);
        await menuSeeder.SeedAsync(ct);
    }

    // Like the menu: the open-day notification texts are seeded at runtime
    // (NotificationTemplateSeeder) rather than via the migration, so the harness plants the standard
    // set itself — exactly as production does through DatabaseSeeder.
    public static async Task SeedNotificationTemplatesAsync(
        this IServiceProvider services,
        CancellationToken ct = default
    )
    {
        using var scope = services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var seeder = new NotificationTemplateSeeder(database);
        await seeder.SeedAsync(ct);
    }

    public static async Task SeedStandardTestUsersAsync(
        this IServiceProvider services,
        CancellationToken ct = default
    )
    {
        using var scope = services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();

        database.Users.Add(
            BuildUser(
                hasher,
                username: ChefUsername,
                displayName: ChefDisplayName,
                avatarColorHex: "#C90023",
                payPalHandle: ChefPayPalHandle,
                role: UserRole.Admin,
                password: ChefPassword,
                mustChangePassword: false
            )
        );

        foreach (var colleague in StandardColleagues)
        {
            database.Users.Add(
                BuildUser(
                    hasher,
                    username: colleague.Username,
                    displayName: colleague.DisplayName,
                    avatarColorHex: colleague.AvatarColorHex,
                    payPalHandle: colleague.PayPalHandle,
                    role: UserRole.Employee,
                    password: InitialColleaguePassword,
                    mustChangePassword: true
                )
            );
        }

        await database.SaveChangesAsync(ct);
    }

    public static async Task<Guid> SeedUserAsync(
        this IServiceProvider services,
        string username,
        string displayName,
        string password,
        UserRole role = UserRole.Employee,
        bool mustChangePassword = false,
        string? payPalHandle = null,
        string avatarColorHex = "#455A64",
        CancellationToken ct = default
    )
    {
        using var scope = services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();

        var user = BuildUser(
            hasher,
            username,
            displayName,
            avatarColorHex,
            payPalHandle,
            role,
            password,
            mustChangePassword
        );
        database.Users.Add(user);
        await database.SaveChangesAsync(ct);
        return user.Id;
    }

    private static User BuildUser(
        IPasswordHasher hasher,
        string username,
        string displayName,
        string avatarColorHex,
        string? payPalHandle,
        UserRole role,
        string password,
        bool mustChangePassword
    )
    {
        var hashed = hasher.Hash(password);
        return new User
        {
            Id = Guid.NewGuid(),
            Username = username,
            NormalizedUserName = username.ToLowerInvariant(),
            DisplayName = displayName,
            PayPalHandle = payPalHandle,
            PasswordHash = hashed.Hash,
            PasswordSalt = hashed.Salt,
            Role = role,
            IsActive = true,
            MustChangePassword = mustChangePassword,
            AvatarColorHex = avatarColorHex,
            CreatedAt = DateTimeOffset.UtcNow,
        };
    }

    private sealed record TestUser(
        string Username,
        string DisplayName,
        string AvatarColorHex,
        string? PayPalHandle
    );
}
