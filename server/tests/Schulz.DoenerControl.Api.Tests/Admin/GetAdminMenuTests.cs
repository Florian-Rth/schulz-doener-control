using System.Net;
using System.Net.Http.Json;
using Schulz.DoenerControl.Api.Endpoints.Admin.Menu;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Admin;

// GET /api/admin/menu returns the full menu — including items the admin has retired — with the
// IsAvailable flag, sorted by SortOrder. This is the management view, distinct from the public
// GET /api/menu which hides retired items.
public sealed class GetAdminMenuTests : DoenerControlTestBase
{
    public GetAdminMenuTests(DoenerControlApp app)
        : base(app) { }

    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task Should_Return_All_Six_Canonical_Items_Available()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        var response = await admin.GetAsync(AdminMenuTestHelpers.MenuUrl);
        var body = await response.Content.ReadFromJsonAsync<GetAdminMenuResponse>(Ct);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.Equal(6, body!.Items.Count);
        Assert.Equal(
            ["doener", "duerum", "big", "box", "danny", "pizza"],
            body.Items.Select(item => item.Id).ToArray()
        );
        Assert.All(body.Items, item => Assert.True(item.IsAvailable));
    }

    [Fact]
    public async Task Should_Include_Retired_Items_That_Public_Menu_Hides()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        // Retire "pizza" by toggling IsAvailable off via the update endpoint.
        await admin.PutJsonAsync(
            $"{AdminMenuTestHelpers.MenuUrl}/pizza",
            new
            {
                Name = "Pizza",
                DefaultPriceCents = 900,
                Kind = "pizza",
                MaterialIcon = "local_pizza",
                Note = (string?)null,
                IsInsider = false,
                SortOrder = 6,
                IsAvailable = false,
            }
        );

        var response = await admin.GetAsync(AdminMenuTestHelpers.MenuUrl);
        var body = await response.Content.ReadFromJsonAsync<GetAdminMenuResponse>(Ct);

        Assert.NotNull(body);
        var pizza = body!.Items.Single(item => item.Id == "pizza");
        Assert.False(pizza.IsAvailable);
        Assert.Equal(6, body.Items.Count);
    }
}
