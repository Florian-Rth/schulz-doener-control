using System.Net;
using System.Net.Http.Json;
using Schulz.DoenerControl.Api.Endpoints.Admin.NotificationTemplates;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Admin;

// PUT /api/admin/notification-templates/{id} edits an existing notification text. 404 for a missing
// id, 400 for an empty body. Admin-only.
public sealed class PutAdminNotificationTemplateTests : DoenerControlTestBase
{
    public PutAdminNotificationTemplateTests(DoenerControlApp app)
        : base(app) { }

    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task Should_Update_Template()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);
        var id = await AdminNotificationTemplateTestHelpers.FirstTemplateIdAsync(App);

        var response = await admin.PutJsonAsync(
            $"{AdminNotificationTemplateTestHelpers.TemplatesUrl}/{id}",
            new
            {
                Synonym = "Klappkatze",
                Body = "Die Klappkatze ruft zum Festmahl! 🐱",
                IsActive = false,
            }
        );
        var body = await response.Content.ReadFromJsonAsync<PutAdminNotificationTemplateResponse>(
            Ct
        );

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.Equal("Klappkatze", body!.Item.Synonym);
        Assert.False(body.Item.IsActive);

        var stored = await AdminNotificationTemplateTestHelpers.FindAsync(App, id);
        Assert.NotNull(stored);
        Assert.Equal("Die Klappkatze ruft zum Festmahl! 🐱", stored!.Body);
        Assert.False(stored.IsActive);
    }

    [Fact]
    public async Task Should_Return404_When_Missing()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        var response = await admin.PutJsonAsync(
            $"{AdminNotificationTemplateTestHelpers.TemplatesUrl}/{Guid.NewGuid()}",
            new
            {
                Synonym = "Klappkatze",
                Body = "Egal.",
                IsActive = true,
            }
        );

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Should_Return400_When_Body_Empty()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);
        var id = await AdminNotificationTemplateTestHelpers.FirstTemplateIdAsync(App);

        var response = await admin.PutJsonAsync(
            $"{AdminNotificationTemplateTestHelpers.TemplatesUrl}/{id}",
            new
            {
                Synonym = "Klappkatze",
                Body = "",
                IsActive = true,
            }
        );

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
