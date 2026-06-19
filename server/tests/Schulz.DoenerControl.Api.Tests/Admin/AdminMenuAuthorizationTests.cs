using System.Net;
using Schulz.DoenerControl.Api.Tests.Auth;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Admin;

// The role-authorization matrix for /api/admin/menu: anonymous → 401, an authenticated Employee →
// 403, an Admin → 200. Proves Roles("Admin") is enforced end to end through the cookie-borne JWT
// role claim, mirroring the user-management matrix.
public sealed class AdminMenuAuthorizationTests : DoenerControlTestBase
{
    public AdminMenuAuthorizationTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Return401_When_Anonymous()
    {
        var anonymous = new AuthTestClient(App.CreateClient());

        var response = await anonymous.GetAsync(AdminMenuTestHelpers.MenuUrl);

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

        var response = await employee.GetAsync(AdminMenuTestHelpers.MenuUrl);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Should_Return200_When_Admin()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        var response = await admin.GetAsync(AdminMenuTestHelpers.MenuUrl);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Should_Forbid_Employee_From_Creating_Item()
    {
        var employee = await AdminUserTestHelpers.LoginAsEmployeeAsync(
            App,
            "s.yilmaz",
            "kollegePw22"
        );

        var response = await employee.PostJsonAsync(
            AdminMenuTestHelpers.MenuUrl,
            new
            {
                Name = "Falafel",
                DefaultPriceCents = 600,
                Kind = "doener",
                MaterialIcon = "eco",
                IsInsider = false,
                SortOrder = 9,
                IsAvailable = true,
            }
        );

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }
}
