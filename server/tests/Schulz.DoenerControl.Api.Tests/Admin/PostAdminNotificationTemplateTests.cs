using System.Net;
using System.Net.Http.Json;
using Schulz.DoenerControl.Api.Endpoints.Admin.NotificationTemplates;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Admin;

// POST /api/admin/notification-templates creates a new open-day notification text, persists it, and
// validates a non-empty synonym and body. Admin-only.
public sealed class PostAdminNotificationTemplateTests : DoenerControlTestBase
{
    public PostAdminNotificationTemplateTests(DoenerControlApp app)
        : base(app) { }

    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task Should_Create_Template()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        var response = await admin.PostJsonAsync(
            AdminNotificationTemplateTestHelpers.TemplatesUrl,
            new
            {
                Synonym = "Teigtaschen-Torpedo",
                Body = "Der Teigtaschen-Torpedo ist startklar! Wer ist dabei? 🚀",
                IsActive = true,
            }
        );
        var body = await response.Content.ReadFromJsonAsync<PostAdminNotificationTemplateResponse>(
            Ct
        );

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.NotNull(body);
        Assert.Equal("Teigtaschen-Torpedo", body!.Item.Synonym);
        Assert.True(body.Item.IsActive);
        Assert.NotEqual(Guid.Empty, body.Item.Id);

        var stored = await AdminNotificationTemplateTestHelpers.FindAsync(App, body.Item.Id);
        Assert.NotNull(stored);
        Assert.Equal("Der Teigtaschen-Torpedo ist startklar! Wer ist dabei? 🚀", stored!.Body);
    }

    [Fact]
    public async Task Should_Return400_When_Synonym_Empty()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        var response = await admin.PostJsonAsync(
            AdminNotificationTemplateTestHelpers.TemplatesUrl,
            new
            {
                Synonym = "",
                Body = "Irgendein Text.",
                IsActive = true,
            }
        );

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Should_Return400_When_Body_Empty()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        var response = await admin.PostJsonAsync(
            AdminNotificationTemplateTestHelpers.TemplatesUrl,
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
