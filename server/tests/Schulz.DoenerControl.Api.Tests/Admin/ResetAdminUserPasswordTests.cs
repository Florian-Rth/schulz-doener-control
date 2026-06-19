using System.Net;
using System.Net.Http.Json;
using Schulz.DoenerControl.Api.Endpoints.Admin.Users;
using Schulz.DoenerControl.Api.Endpoints.Auth;
using Schulz.DoenerControl.Api.Tests.Auth;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Admin;

public sealed class ResetAdminUserPasswordTests : DoenerControlTestBase
{
    public ResetAdminUserPasswordTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Issue_New_Temp_Password_Force_Change_And_Revoke_Tokens()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        // Onboard an employee (clears must-change, issues a refresh token).
        var employee = await AdminUserTestHelpers.LoginAsEmployeeAsync(
            App,
            "n.fischer",
            "kollegePw55"
        );
        var targetId = await AdminUserTestHelpers.UserIdAsync(App, "n.fischer");
        Assert.True(await AdminUserTestHelpers.ActiveRefreshTokenCountAsync(App, targetId) > 0);

        var response = await admin.PostAsync(
            $"{AdminUserTestHelpers.UsersUrl}/{targetId}/reset-password"
        );
        var body = await response.Content.ReadFromJsonAsync<ResetAdminUserPasswordResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.False(string.IsNullOrWhiteSpace(body!.TemporaryPassword));

        // Refresh tokens are revoked: the old session is dead.
        Assert.Equal(0, await AdminUserTestHelpers.ActiveRefreshTokenCountAsync(App, targetId));
        var deadSession = await employee.PostAsync("/api/auth/refresh");
        Assert.Equal(HttpStatusCode.Unauthorized, deadSession.StatusCode);

        // The new temp password works and forces a change again.
        var reset = new AuthTestClient(App.CreateClient());
        var loginResponse = await reset.PostJsonAsync(
            "/api/auth/login",
            new { Username = "n.fischer", Password = body.TemporaryPassword }
        );
        var loginBody = await loginResponse.Content.ReadFromJsonAsync<LoginResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);
        Assert.True(loginBody!.MustChangePassword);
    }

    [Fact]
    public async Task Should_Return404_When_User_Missing()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        var response = await admin.PostAsync(
            $"{AdminUserTestHelpers.UsersUrl}/{Guid.NewGuid()}/reset-password"
        );

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
