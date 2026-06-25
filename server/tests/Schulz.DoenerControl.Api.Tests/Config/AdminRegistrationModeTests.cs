using System.Net;
using System.Net.Http.Json;
using Schulz.DoenerControl.Api.Tests.Admin;
using Schulz.DoenerControl.Api.Tests.Auth;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Config;

// Admin management of the runtime self-registration policy. The seeded default is Enabled (mode 1)
// with no secret key. An admin reads and updates the singleton at /api/admin/registration-mode; once
// the admin flips the policy, the anonymous register endpoint honours it immediately (no redeploy).
public sealed class AdminRegistrationModeTests : DoenerControlTestBase
{
    private const string RegistrationModeUrl = "/api/admin/registration-mode";
    private const string RegisterUrl = "/api/auth/register";

    public AdminRegistrationModeTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Return_Seeded_Default_Enabled_When_Admin_Gets()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        var response = await admin.GetAsync(RegistrationModeUrl);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<RegistrationModeBody>(
            TestContext.Current.CancellationToken
        );
        Assert.NotNull(body);
        Assert.Equal(1, body!.Mode);
        Assert.Null(body.SecretKey);
    }

    [Fact]
    public async Task Should_Return_Forbidden_When_NonAdmin_Gets()
    {
        var employee = await AdminUserTestHelpers.LoginAsEmployeeAsync(
            App,
            "l.brandt",
            "Doener1234"
        );

        var response = await employee.GetAsync(RegistrationModeUrl);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Should_Update_To_SecretKeyOnly_With_Key_When_Admin_Puts()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        var response = await admin.PutJsonAsync(
            RegistrationModeUrl,
            new { Mode = 3, SecretKey = "GEHEIM-2026" }
        );

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<RegistrationModeBody>(
            TestContext.Current.CancellationToken
        );
        Assert.NotNull(body);
        Assert.Equal(3, body!.Mode);
        Assert.Equal("GEHEIM-2026", body.SecretKey);
    }

    [Fact]
    public async Task Should_Clear_SecretKey_When_Switching_Back_To_Enabled()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);
        await admin.PutJsonAsync(RegistrationModeUrl, new { Mode = 3, SecretKey = "GEHEIM-2026" });

        var response = await admin.PutJsonAsync(RegistrationModeUrl, new { Mode = 1 });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<RegistrationModeBody>(
            TestContext.Current.CancellationToken
        );
        Assert.NotNull(body);
        Assert.Equal(1, body!.Mode);
        Assert.Null(body.SecretKey);
    }

    [Fact]
    public async Task Should_Return400_When_PutSecretKeyOnly_Without_Key()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        var response = await admin.PutJsonAsync(RegistrationModeUrl, new { Mode = 3 });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Should_Return400_When_PutMode_OutOfRange()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        var response = await admin.PutJsonAsync(RegistrationModeUrl, new { Mode = 9 });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Should_Close_Registration_When_Admin_Puts_Disabled()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);
        var put = await admin.PutJsonAsync(RegistrationModeUrl, new { Mode = 2 });
        Assert.Equal(HttpStatusCode.OK, put.StatusCode);

        var anon = new AuthTestClient(App.CreateClient());
        var register = await anon.PostJsonAsync(
            RegisterUrl,
            new
            {
                Username = "z.zuspaet",
                DisplayName = "Zoe Zuspät",
                Password = "Doener1234",
            }
        );

        Assert.Equal(HttpStatusCode.Forbidden, register.StatusCode);
    }

    private sealed record RegistrationModeBody(int Mode, string? SecretKey);
}
