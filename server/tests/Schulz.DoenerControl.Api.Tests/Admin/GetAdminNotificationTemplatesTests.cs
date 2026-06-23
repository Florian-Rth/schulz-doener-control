using System.Net;
using System.Net.Http.Json;
using Schulz.DoenerControl.Api.Endpoints.Admin.NotificationTemplates;
using Schulz.DoenerControl.Infrastructure.Persistence.Seeding;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Admin;

// GET /api/admin/notification-templates returns every open-day notification text (including disabled
// ones) for the admin management screen. A fresh database is seeded with the standard set. Admin-only.
public sealed class GetAdminNotificationTemplatesTests : DoenerControlTestBase
{
    public GetAdminNotificationTemplatesTests(DoenerControlApp app)
        : base(app) { }

    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task Should_Return_The_Seeded_Standard_Templates()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        var response = await admin.GetAsync(AdminNotificationTemplateTestHelpers.TemplatesUrl);
        var body = await response.Content.ReadFromJsonAsync<GetAdminNotificationTemplatesResponse>(
            Ct
        );

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.Equal(NotificationTemplateSeeder.CanonicalTemplates.Count, body!.Items.Count);

        var expectedSynonyms = NotificationTemplateSeeder
            .CanonicalTemplates.Select(template => template.Synonym)
            .OrderBy(synonym => synonym)
            .ToArray();
        Assert.Equal(
            expectedSynonyms,
            body.Items.Select(item => item.Synonym).OrderBy(synonym => synonym).ToArray()
        );
        Assert.All(body.Items, item => Assert.False(string.IsNullOrWhiteSpace(item.Body)));
        Assert.All(body.Items, item => Assert.True(item.IsActive));
    }
}
