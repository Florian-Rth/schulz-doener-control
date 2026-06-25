using System.Net;
using System.Net.Http.Json;
using Schulz.DoenerControl.Api.Endpoints.Admin.Users;
using Schulz.DoenerControl.Core.Enums;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Admin;

public sealed class PutAdminUserTests : DoenerControlTestBase
{
    public PutAdminUserTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Update_Fields_And_Return_Summary()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);
        var targetId = await AdminUserTestHelpers.UserIdAsync(App, "t.klein");

        var response = await admin.PutJsonAsync(
            $"{AdminUserTestHelpers.UsersUrl}/{targetId}",
            new
            {
                DisplayName = "Tobias Klein-Neu",
                PayPalHandle = "https://paypal.me/TobiNeu",
                Role = (int)UserRole.Employee,
                IsActive = true,
            }
        );
        var body = await response.Content.ReadFromJsonAsync<PutAdminUserResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("Tobias Klein-Neu", body!.User.DisplayName);
        // The response DTO surfaces the reconstructed base link the admin entered...
        Assert.Equal("https://paypal.me/TobiNeu", body.User.PayPalHandle);

        var persisted = await AdminUserTestHelpers.FindUserAsync(App, "t.klein");
        Assert.Equal("Tobias Klein-Neu", persisted!.DisplayName);
        // ...while the DB stores only the bare handle parsed out of that link.
        Assert.Equal("TobiNeu", persisted.PayPalHandle);
    }

    [Fact]
    public async Task Should_Return404_When_User_Missing()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        var response = await admin.PutJsonAsync(
            $"{AdminUserTestHelpers.UsersUrl}/{Guid.NewGuid()}",
            new
            {
                DisplayName = "Niemand",
                Role = (int)UserRole.Employee,
                IsActive = true,
            }
        );

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Should_Return409_When_Demoting_Last_Active_Admin()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);
        var chefId = await AdminUserTestHelpers.UserIdAsync(App, "m.wagner");

        // Chef is the only seeded admin; demoting them must be refused.
        var response = await admin.PutJsonAsync(
            $"{AdminUserTestHelpers.UsersUrl}/{chefId}",
            new
            {
                DisplayName = "Markus Wagner",
                Role = (int)UserRole.Employee,
                IsActive = true,
            }
        );

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);

        var persisted = await AdminUserTestHelpers.FindUserAsync(App, "m.wagner");
        Assert.Equal(UserRole.Admin, persisted!.Role);
    }

    [Fact]
    public async Task Should_Allow_Demoting_Admin_When_Another_Active_Admin_Exists()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        // Provision a second admin so the seeded chef is no longer the last one.
        var createResponse = await admin.PostJsonAsync(
            AdminUserTestHelpers.UsersUrl,
            new
            {
                Username = "z.zweit",
                DisplayName = "Zweiter Admin",
                Role = (int)UserRole.Admin,
            }
        );
        var created = await createResponse.Content.ReadFromJsonAsync<PostAdminUserResponse>(
            TestContext.Current.CancellationToken
        );

        var response = await admin.PutJsonAsync(
            $"{AdminUserTestHelpers.UsersUrl}/{created!.UserId}",
            new
            {
                DisplayName = "Zweiter Admin",
                Role = (int)UserRole.Employee,
                IsActive = true,
            }
        );

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var persisted = await AdminUserTestHelpers.FindUserAsync(App, "z.zweit");
        Assert.Equal(UserRole.Employee, persisted!.Role);
    }

    [Fact]
    public async Task Should_Revoke_Refresh_Tokens_When_Role_Changes()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        // The employee logs in (issuing a refresh token), then the admin promotes them.
        var employee = await AdminUserTestHelpers.LoginAsEmployeeAsync(
            App,
            "a.schaefer",
            "kollegePw33"
        );
        var targetId = await AdminUserTestHelpers.UserIdAsync(App, "a.schaefer");

        Assert.True(await AdminUserTestHelpers.ActiveRefreshTokenCountAsync(App, targetId) > 0);

        var response = await admin.PutJsonAsync(
            $"{AdminUserTestHelpers.UsersUrl}/{targetId}",
            new
            {
                DisplayName = "Anna Schäfer",
                Role = (int)UserRole.Admin,
                IsActive = true,
            }
        );

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(0, await AdminUserTestHelpers.ActiveRefreshTokenCountAsync(App, targetId));

        // The old refresh cookie no longer rotates: the session is dead.
        var refresh = await employee.PostAsync("/api/auth/refresh");
        Assert.Equal(HttpStatusCode.Unauthorized, refresh.StatusCode);
    }
}
