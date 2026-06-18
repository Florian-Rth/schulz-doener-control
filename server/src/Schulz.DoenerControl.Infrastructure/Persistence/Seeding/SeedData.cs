using Schulz.DoenerControl.Core.Enums;

namespace Schulz.DoenerControl.Infrastructure.Persistence.Seeding;

// The 13 office employees. Markus Wagner (m.wagner) is the demo "Chef" and the verified dev
// account whose password is pre-set (MustChangePassword=false) so tests and local dev can log
// in without the forced-change gate. The four colleagues shown on the mock leaderboard keep
// their exact display names and avatar colors; the rest fill out the ~13-person office.
internal static class SeedData
{
    // Known dev password for the verified account. Local/dev only — never a production secret.
    public const string DevUsername = "m.wagner";
    public const string DevPassword = "doener-dev-2026";

    // Initial password every freshly-provisioned account gets; forces a change on first login.
    public const string InitialPassword = "Schulz-Start!";

    public static readonly IReadOnlyList<SeedUser> Users = new[]
    {
        new SeedUser(
            "m.wagner",
            "Markus Wagner",
            "#C90023",
            UserRole.Admin,
            "MarkusWagnerHB",
            MustChangePassword: false
        ),
        new SeedUser(
            "l.brandt",
            "Lukas Brandt",
            "#00728E",
            UserRole.Employee,
            "LukasBrandtHB",
            MustChangePassword: true
        ),
        new SeedUser(
            "s.yilmaz",
            "Sara Yılmaz",
            "#ED701C",
            UserRole.Employee,
            "SaraYHB",
            MustChangePassword: true
        ),
        new SeedUser(
            "t.klein",
            "Tobias Klein",
            "#45B8A1",
            UserRole.Employee,
            null,
            MustChangePassword: true
        ),
        new SeedUser(
            "a.schaefer",
            "Anna Schäfer",
            "#7B4FB0",
            UserRole.Employee,
            null,
            MustChangePassword: true
        ),
        new SeedUser(
            "j.hoffmann",
            "Jonas Hoffmann",
            "#2E7D32",
            UserRole.Employee,
            null,
            MustChangePassword: true
        ),
        new SeedUser(
            "n.fischer",
            "Nele Fischer",
            "#C2185B",
            UserRole.Employee,
            null,
            MustChangePassword: true
        ),
        new SeedUser(
            "d.koch",
            "David Koch",
            "#1565C0",
            UserRole.Employee,
            null,
            MustChangePassword: true
        ),
        new SeedUser(
            "p.weber",
            "Pia Weber",
            "#00897B",
            UserRole.Employee,
            null,
            MustChangePassword: true
        ),
        new SeedUser(
            "f.richter",
            "Felix Richter",
            "#5D4037",
            UserRole.Employee,
            null,
            MustChangePassword: true
        ),
        new SeedUser(
            "m.bauer",
            "Mira Bauer",
            "#F9A825",
            UserRole.Employee,
            null,
            MustChangePassword: true
        ),
        new SeedUser(
            "e.wolf",
            "Erik Wolf",
            "#455A64",
            UserRole.Employee,
            null,
            MustChangePassword: true
        ),
        new SeedUser(
            "h.neumann",
            "Hanna Neumann",
            "#8E24AA",
            UserRole.Employee,
            null,
            MustChangePassword: true
        ),
    };
}
