using System.Net;
using System.Net.Http.Json;
using Schulz.DoenerControl.Api.Endpoints.Admin.Menu;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Admin;

// PUT /api/admin/menu/{id} edits an existing item's fields and persists them, 404s on a missing id,
// and validates the body. Admin-only.
public sealed class PutAdminMenuTests : DoenerControlTestBase
{
    public PutAdminMenuTests(DoenerControlApp app)
        : base(app) { }

    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task Should_Update_Fields_And_Persist()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        var response = await admin.PutJsonAsync(
            $"{AdminMenuTestHelpers.MenuUrl}/doener",
            new
            {
                Name = "Döner Deluxe",
                DefaultPriceCents = 850,
                Kind = "doener",
                MaterialIcon = "kebab_dining",
                Note = "Mehr Fleisch",
                IsInsider = true,
                SortOrder = 1,
                IsAvailable = true,
            }
        );
        var body = await response.Content.ReadFromJsonAsync<PutAdminMenuResponse>(Ct);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.Equal("Döner Deluxe", body!.Item.Name);
        Assert.Equal(850, body.Item.DefaultPriceCents);

        var stored = await AdminMenuTestHelpers.FindMenuItemAsync(App, "doener");
        Assert.NotNull(stored);
        Assert.Equal("Döner Deluxe", stored!.Name);
        Assert.Equal(850, stored.DefaultPriceCents);
        Assert.Equal("Mehr Fleisch", stored.Note);
        Assert.True(stored.IsInsider);
    }

    [Fact]
    public async Task Should_Return404_When_Item_Missing()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        var response = await admin.PutJsonAsync(
            $"{AdminMenuTestHelpers.MenuUrl}/does-not-exist",
            new
            {
                Name = "Nichts",
                DefaultPriceCents = 100,
                Kind = "doener",
                MaterialIcon = "help",
                IsInsider = false,
                SortOrder = 1,
                IsAvailable = true,
            }
        );

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Should_Return400_When_Price_Negative()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        var response = await admin.PutJsonAsync(
            $"{AdminMenuTestHelpers.MenuUrl}/doener",
            new
            {
                Name = "Döner",
                DefaultPriceCents = -5,
                Kind = "doener",
                MaterialIcon = "kebab_dining",
                IsInsider = false,
                SortOrder = 1,
                IsAvailable = true,
            }
        );

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
