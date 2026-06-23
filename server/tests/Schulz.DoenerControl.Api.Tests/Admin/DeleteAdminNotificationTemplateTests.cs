using System.Net;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Admin;

// DELETE /api/admin/notification-templates/{id} hard-deletes a notification text (the body is copied
// onto each day, never FK-referenced). 204 on success, 404 for a missing id. Admin-only.
public sealed class DeleteAdminNotificationTemplateTests : DoenerControlTestBase
{
    public DeleteAdminNotificationTemplateTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Delete_Template()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);
        var id = await AdminNotificationTemplateTestHelpers.FirstTemplateIdAsync(App);

        var response = await admin.DeleteAsync(
            $"{AdminNotificationTemplateTestHelpers.TemplatesUrl}/{id}"
        );

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Null(await AdminNotificationTemplateTestHelpers.FindAsync(App, id));
    }

    [Fact]
    public async Task Should_Return404_When_Missing()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        var response = await admin.DeleteAsync(
            $"{AdminNotificationTemplateTestHelpers.TemplatesUrl}/{Guid.NewGuid()}"
        );

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
