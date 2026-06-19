using System.Net;
using System.Net.Http.Json;
using Schulz.DoenerControl.Api.Endpoints.Admin.Users;
using Schulz.DoenerControl.Api.Endpoints.Auth;
using Schulz.DoenerControl.Api.Tests.Auth;
using Schulz.DoenerControl.Core.Enums;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Admin;

public sealed class PostAdminUserTests : DoenerControlTestBase
{
    public PostAdminUserTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Create_Active_ForcedChange_User_And_Return_Temp_Password()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        var response = await admin.PostJsonAsync(
            AdminUserTestHelpers.UsersUrl,
            new
            {
                Username = "k.neumann",
                DisplayName = "Klara Neumann",
                PayPalHandle = "KlaraN",
            }
        );
        var body = await response.Content.ReadFromJsonAsync<PostAdminUserResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.NotNull(body);
        Assert.Equal("k.neumann", body!.Username);
        Assert.False(string.IsNullOrWhiteSpace(body.TemporaryPassword));

        var persisted = await AdminUserTestHelpers.FindUserAsync(App, "k.neumann");
        Assert.NotNull(persisted);
        Assert.True(persisted!.IsActive);
        Assert.True(persisted.MustChangePassword);
        Assert.Equal(UserRole.Employee, persisted.Role);
        Assert.Equal("KlaraN", persisted.PayPalHandle);
    }

    [Fact]
    public async Task Should_Create_Admin_When_Role_Specified()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        var response = await admin.PostJsonAsync(
            AdminUserTestHelpers.UsersUrl,
            new
            {
                Username = "v.admin",
                DisplayName = "Vera Admin",
                Role = (int)UserRole.Admin,
            }
        );

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var persisted = await AdminUserTestHelpers.FindUserAsync(App, "v.admin");
        Assert.Equal(UserRole.Admin, persisted!.Role);
    }

    [Fact]
    public async Task Should_Let_New_User_Login_With_Temp_Password_And_Force_Change()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        var createResponse = await admin.PostJsonAsync(
            AdminUserTestHelpers.UsersUrl,
            new { Username = "o.frisch", DisplayName = "Otto Frisch" }
        );
        var created = await createResponse.Content.ReadFromJsonAsync<PostAdminUserResponse>(
            TestContext.Current.CancellationToken
        );

        // The temp password really authenticates (hashed via the production path).
        var newUser = new AuthTestClient(App.CreateClient());
        var loginResponse = await newUser.PostJsonAsync(
            "/api/auth/login",
            new { Username = "o.frisch", Password = created!.TemporaryPassword }
        );
        var loginBody = await loginResponse.Content.ReadFromJsonAsync<LoginResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);
        Assert.True(loginBody!.MustChangePassword);

        // While the forced-change flag is set, protected endpoints are gated (403).
        var gated = await newUser.GetAsync("/api/profile");
        Assert.Equal(HttpStatusCode.Forbidden, gated.StatusCode);
    }

    [Fact]
    public async Task Should_Return409_When_Username_Duplicate_CaseInsensitive()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        // "m.wagner" already exists (seeded admin); a case variant must still collide.
        var response = await admin.PostJsonAsync(
            AdminUserTestHelpers.UsersUrl,
            new { Username = "M.Wagner", DisplayName = "Doppelgänger" }
        );

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Should_Return400_When_Username_Has_Invalid_Characters()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        var response = await admin.PostJsonAsync(
            AdminUserTestHelpers.UsersUrl,
            new { Username = "Has Space", DisplayName = "Wer auch immer" }
        );

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
