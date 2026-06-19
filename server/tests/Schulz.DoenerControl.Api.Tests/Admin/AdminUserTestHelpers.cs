using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Schulz.DoenerControl.Api.Tests.Auth;
using Schulz.DoenerControl.Core.Entities;
using Schulz.DoenerControl.Infrastructure.Persistence;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Admin;

// Shared helpers for the admin user-management integration tests: logging in as the seeded admin
// "Chef", as a fully-onboarded employee (one who has already cleared the forced-change gate), and
// reading users straight from the DbContext to assert persisted state.
internal static class AdminUserTestHelpers
{
    public const string UsersUrl = "/api/admin/users";

    private const string LoginUrl = "/api/auth/login";
    private const string ChangePasswordUrl = "/api/auth/change-password";

    public static async Task<AuthTestClient> LoginAsAdminAsync(DoenerControlApp app)
    {
        var auth = new AuthTestClient(app.CreateClient());
        await auth.PostJsonAsync(
            LoginUrl,
            new { Username = TestSeeding.ChefUsername, Password = TestSeeding.ChefPassword }
        );
        return auth;
    }

    // Logs in a seeded colleague and clears the forced-change gate so the returned client can hit
    // protected endpoints (otherwise the must-change gate 403s everything but change-password).
    public static async Task<AuthTestClient> LoginAsEmployeeAsync(
        DoenerControlApp app,
        string username,
        string newPassword
    )
    {
        var first = new AuthTestClient(app.CreateClient());
        await first.PostJsonAsync(
            LoginUrl,
            new { Username = username, Password = TestSeeding.InitialColleaguePassword }
        );
        await first.PostJsonAsync(
            ChangePasswordUrl,
            new
            {
                CurrentPassword = TestSeeding.InitialColleaguePassword,
                NewPassword = newPassword,
            }
        );

        var auth = new AuthTestClient(app.CreateClient());
        await auth.PostJsonAsync(LoginUrl, new { Username = username, Password = newPassword });
        return auth;
    }

    public static async Task<User?> FindUserAsync(DoenerControlApp app, string normalizedUserName)
    {
        using var scope = app.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        return await database.Users.FirstOrDefaultAsync(
            user => user.NormalizedUserName == normalizedUserName,
            TestContext.Current.CancellationToken
        );
    }

    public static async Task<int> ActiveRefreshTokenCountAsync(DoenerControlApp app, Guid userId)
    {
        using var scope = app.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        return await database.RefreshTokens.CountAsync(
            token => token.UserId == userId && token.RevokedAt == null,
            TestContext.Current.CancellationToken
        );
    }

    public static async Task<Guid> UserIdAsync(DoenerControlApp app, string normalizedUserName)
    {
        var user = await FindUserAsync(app, normalizedUserName);
        return user!.Id;
    }
}
