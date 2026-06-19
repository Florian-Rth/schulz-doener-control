using System.Net;
using System.Net.Http.Json;
using Schulz.DoenerControl.Api.Endpoints.Admin.Menu;
using Schulz.DoenerControl.Core.Enums;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Admin;

// POST /api/admin/menu creates a new item, persists it, derives an id from the name when none is
// given, rejects a duplicate id with 409, and validates name/price/kind. Admin-only.
public sealed class PostAdminMenuTests : DoenerControlTestBase
{
    public PostAdminMenuTests(DoenerControlApp app)
        : base(app) { }

    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task Should_Create_Item_With_Explicit_Id()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        var response = await admin.PostJsonAsync(
            AdminMenuTestHelpers.MenuUrl,
            new
            {
                Id = "falafel",
                Name = "Falafel",
                DefaultPriceCents = 600,
                Kind = "doener",
                MaterialIcon = "eco",
                Note = "Vegan",
                IsInsider = false,
                SortOrder = 7,
                IsAvailable = true,
            }
        );
        var body = await response.Content.ReadFromJsonAsync<PostAdminMenuResponse>(Ct);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.NotNull(body);
        Assert.Equal("falafel", body!.Item.Id);
        Assert.Equal("doener", body.Item.Kind);
        Assert.Equal("6,00 €", body.Item.DefaultPriceLabel);

        var stored = await AdminMenuTestHelpers.FindMenuItemAsync(App, "falafel");
        Assert.NotNull(stored);
        Assert.Equal("Falafel", stored!.Name);
        Assert.Equal(ProductKind.Doener, stored.Kind);
        Assert.Equal("Vegan", stored.Note);
        Assert.True(stored.IsAvailable);
    }

    [Fact]
    public async Task Should_Derive_Id_From_Name_When_Id_Omitted()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        var response = await admin.PostJsonAsync(
            AdminMenuTestHelpers.MenuUrl,
            new
            {
                Name = "Lahmacun Spezial",
                DefaultPriceCents = 550,
                Kind = "doener",
                MaterialIcon = "flatware",
                IsInsider = false,
                SortOrder = 8,
                IsAvailable = true,
            }
        );
        var body = await response.Content.ReadFromJsonAsync<PostAdminMenuResponse>(Ct);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.NotNull(body);
        Assert.Equal("lahmacun-spezial", body!.Item.Id);
    }

    [Fact]
    public async Task Should_Return409_When_Id_Already_Exists()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        var response = await admin.PostJsonAsync(
            AdminMenuTestHelpers.MenuUrl,
            new
            {
                Id = "doener",
                Name = "Döner Zwei",
                DefaultPriceCents = 800,
                Kind = "doener",
                MaterialIcon = "kebab_dining",
                IsInsider = false,
                SortOrder = 9,
                IsAvailable = true,
            }
        );

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Should_Return400_When_Name_Empty()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        var response = await admin.PostJsonAsync(
            AdminMenuTestHelpers.MenuUrl,
            new
            {
                Name = "",
                DefaultPriceCents = 600,
                Kind = "doener",
                MaterialIcon = "eco",
                IsInsider = false,
                SortOrder = 7,
                IsAvailable = true,
            }
        );

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Should_Return400_When_Price_Negative()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        var response = await admin.PostJsonAsync(
            AdminMenuTestHelpers.MenuUrl,
            new
            {
                Name = "Falafel",
                DefaultPriceCents = -1,
                Kind = "doener",
                MaterialIcon = "eco",
                IsInsider = false,
                SortOrder = 7,
                IsAvailable = true,
            }
        );

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Should_Return400_When_Kind_Invalid()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        var response = await admin.PostJsonAsync(
            AdminMenuTestHelpers.MenuUrl,
            new
            {
                Name = "Falafel",
                DefaultPriceCents = 600,
                Kind = "burger",
                MaterialIcon = "eco",
                IsInsider = false,
                SortOrder = 7,
                IsAvailable = true,
            }
        );

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
