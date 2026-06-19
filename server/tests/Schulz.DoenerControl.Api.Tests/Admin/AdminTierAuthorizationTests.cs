using System.Net;
using Schulz.DoenerControl.Api.Tests.Auth;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Admin;

// The role-authorization matrix for /api/admin/tiere (B4): anonymous → 401, an authenticated
// Employee → 403, an Admin → 200. Proves Roles("Admin") is enforced end to end through the
// cookie-borne JWT role claim, mirroring the menu and user-management matrices.
public sealed class AdminTierAuthorizationTests : DoenerControlTestBase
{
    private const string TiereUrl = "/api/admin/tiere";

    public AdminTierAuthorizationTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Return401_When_Anonymous()
    {
        var anonymous = new AuthTestClient(App.CreateClient());

        var response = await anonymous.GetAsync(TiereUrl);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Should_Return403_When_Employee()
    {
        var employee = await AdminUserTestHelpers.LoginAsEmployeeAsync(
            App,
            "l.brandt",
            "kollegePw11"
        );

        var response = await employee.GetAsync(TiereUrl);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Should_Return200_When_Admin()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        var response = await admin.GetAsync(TiereUrl);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
