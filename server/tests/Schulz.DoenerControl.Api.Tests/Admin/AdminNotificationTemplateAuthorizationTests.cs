using System.Net;
using Schulz.DoenerControl.Api.Tests.Auth;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Admin;

// The role-authorization matrix for /api/admin/notification-templates: anonymous → 401, an
// authenticated Employee → 403, an Admin → 200. Proves Roles("Admin") is enforced end to end.
public sealed class AdminNotificationTemplateAuthorizationTests : DoenerControlTestBase
{
    public AdminNotificationTemplateAuthorizationTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Return401_When_Anonymous()
    {
        var anonymous = new AuthTestClient(App.CreateClient());

        var response = await anonymous.GetAsync(AdminNotificationTemplateTestHelpers.TemplatesUrl);

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

        var response = await employee.GetAsync(AdminNotificationTemplateTestHelpers.TemplatesUrl);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Should_Return200_When_Admin()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        var response = await admin.GetAsync(AdminNotificationTemplateTestHelpers.TemplatesUrl);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Should_Forbid_Employee_From_Creating_Template()
    {
        var employee = await AdminUserTestHelpers.LoginAsEmployeeAsync(
            App,
            "s.yilmaz",
            "kollegePw22"
        );

        var response = await employee.PostJsonAsync(
            AdminNotificationTemplateTestHelpers.TemplatesUrl,
            new
            {
                Synonym = "Klappkatze",
                Body = "Die Klappkatze schnurrt!",
                IsActive = true,
            }
        );

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }
}
