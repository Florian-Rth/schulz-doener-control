using System.Net.Http.Json;
using Schulz.DoenerControl.Api.Endpoints.Admin.Menu;
using Schulz.DoenerControl.Api.Endpoints.Menu;
using Schulz.DoenerControl.Api.Tests.Admin;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Menu;

// The public order-form menu (GET /api/menu) must hide items an admin has retired, while the admin
// management view (GET /api/admin/menu) still shows them. Proves the IsAvailable filter is applied
// on the public read path only.
public sealed class MenuAvailabilityTests : DoenerControlTestBase
{
    private const string MenuUrl = "/api/menu";

    public MenuAvailabilityTests(DoenerControlApp app)
        : base(app) { }

    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task Should_Hide_Retired_Item_From_Public_Menu()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        await admin.PutJsonAsync(
            $"{AdminMenuTestHelpers.MenuUrl}/big",
            new
            {
                Name = "Big Döner",
                DefaultPriceCents = 950,
                Kind = "doener",
                MaterialIcon = "lunch_dining",
                Note = (string?)null,
                IsInsider = false,
                SortOrder = 3,
                IsAvailable = false,
            }
        );

        var response = await admin.GetAsync(MenuUrl);
        var body = await response.Content.ReadFromJsonAsync<GetMenuResponse>(Ct);

        Assert.NotNull(body);
        Assert.Equal(5, body!.Items.Count);
        Assert.DoesNotContain(body.Items, item => item.Id == "big");
        // Sort order is preserved among the remaining available items.
        Assert.Equal(
            ["doener", "duerum", "box", "danny", "pizza"],
            body.Items.Select(item => item.Id).ToArray()
        );
    }

    [Fact]
    public async Task Should_Show_Newly_Created_Available_Item_On_Public_Menu()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        await admin.PostJsonAsync(
            AdminMenuTestHelpers.MenuUrl,
            new
            {
                Id = "falafel",
                Name = "Falafel",
                DefaultPriceCents = 600,
                Kind = "doener",
                MaterialIcon = "eco",
                Note = (string?)null,
                IsInsider = false,
                SortOrder = 7,
                IsAvailable = true,
            }
        );

        var response = await admin.GetAsync(MenuUrl);
        var body = await response.Content.ReadFromJsonAsync<GetMenuResponse>(Ct);

        Assert.NotNull(body);
        Assert.Contains(body!.Items, item => item.Id == "falafel");
    }

    [Fact]
    public async Task Should_Hide_Created_Unavailable_Item_From_Public_Menu()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        await admin.PostJsonAsync(
            AdminMenuTestHelpers.MenuUrl,
            new
            {
                Id = "saisonal",
                Name = "Saisonal",
                DefaultPriceCents = 700,
                Kind = "doener",
                MaterialIcon = "ac_unit",
                Note = (string?)null,
                IsInsider = false,
                SortOrder = 8,
                IsAvailable = false,
            }
        );

        var publicResponse = await admin.GetAsync(MenuUrl);
        var publicBody = await publicResponse.Content.ReadFromJsonAsync<GetMenuResponse>(Ct);
        Assert.NotNull(publicBody);
        Assert.DoesNotContain(publicBody!.Items, item => item.Id == "saisonal");

        // But the admin view shows it.
        var adminResponse = await admin.GetAsync(AdminMenuTestHelpers.MenuUrl);
        var adminBody = await adminResponse.Content.ReadFromJsonAsync<GetAdminMenuResponse>(Ct);
        Assert.NotNull(adminBody);
        Assert.Contains(adminBody!.Items, item => item.Id == "saisonal");
    }
}
