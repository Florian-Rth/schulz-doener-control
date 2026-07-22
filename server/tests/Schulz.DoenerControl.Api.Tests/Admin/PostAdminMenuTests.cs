using System.Net;
using System.Net.Http.Json;
using Schulz.DoenerControl.Api.Endpoints.Admin.Menu;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Admin;

// POST /api/admin/menu creates a new item, persists it, derives an id from the name when none is
// given, rejects a duplicate id with 409, and validates name/price/category. Admin-only.
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
                CategoryKey = "doener",
                DefaultPriceCents = 600,
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
        Assert.Equal("doener", body.Item.CategoryKey);
        Assert.Equal("6,00 €", body.Item.DefaultPriceLabel);

        var stored = await AdminMenuTestHelpers.FindMenuItemAsync(App, "falafel");
        Assert.NotNull(stored);
        Assert.Equal("Falafel", stored!.Name);
        Assert.NotNull(stored.CategoryId);
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
                CategoryKey = "doener",
                DefaultPriceCents = 550,
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
                CategoryKey = "doener",
                DefaultPriceCents = 800,
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
                CategoryKey = "doener",
                DefaultPriceCents = 600,
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
                CategoryKey = "doener",
                DefaultPriceCents = -1,
                MaterialIcon = "eco",
                IsInsider = false,
                SortOrder = 7,
                IsAvailable = true,
            }
        );

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Should_Return400_When_Category_Unknown()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        var response = await admin.PostJsonAsync(
            AdminMenuTestHelpers.MenuUrl,
            new
            {
                Name = "Falafel",
                CategoryKey = "burger",
                DefaultPriceCents = 600,
                MaterialIcon = "eco",
                IsInsider = false,
                SortOrder = 7,
                IsAvailable = true,
            }
        );

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
