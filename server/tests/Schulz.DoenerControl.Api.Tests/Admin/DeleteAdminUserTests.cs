using System.Net;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Admin;

public sealed class DeleteAdminUserTests : DoenerControlTestBase
{
    public DeleteAdminUserTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_SoftDeactivate_And_Revoke_Tokens_Returning204()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        var employee = await AdminUserTestHelpers.LoginAsEmployeeAsync(
            App,
            "j.hoffmann",
            "kollegePw44"
        );
        var targetId = await AdminUserTestHelpers.UserIdAsync(App, "j.hoffmann");
        Assert.True(await AdminUserTestHelpers.ActiveRefreshTokenCountAsync(App, targetId) > 0);

        var response = await admin.DeleteAsync($"{AdminUserTestHelpers.UsersUrl}/{targetId}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        var persisted = await AdminUserTestHelpers.FindUserAsync(App, "j.hoffmann");
        Assert.False(persisted!.IsActive);
        Assert.Equal(0, await AdminUserTestHelpers.ActiveRefreshTokenCountAsync(App, targetId));

        // The soft-deactivated user can no longer log in.
        var relogin = await employee.PostAsync("/api/auth/refresh");
        Assert.Equal(HttpStatusCode.Unauthorized, relogin.StatusCode);
    }

    [Fact]
    public async Task Should_Return404_When_User_Missing()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        var response = await admin.DeleteAsync($"{AdminUserTestHelpers.UsersUrl}/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Should_Return409_When_Deactivating_Last_Active_Admin()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);
        var chefId = await AdminUserTestHelpers.UserIdAsync(App, "m.wagner");

        var response = await admin.DeleteAsync($"{AdminUserTestHelpers.UsersUrl}/{chefId}");

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);

        var persisted = await AdminUserTestHelpers.FindUserAsync(App, "m.wagner");
        Assert.True(persisted!.IsActive);
    }
}
