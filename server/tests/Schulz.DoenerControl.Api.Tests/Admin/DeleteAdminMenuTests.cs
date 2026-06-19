using System.Net;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Admin;

// DELETE /api/admin/menu/{id}: an unreferenced item is hard-deleted; an item frozen into an order's
// FK is soft-retired (IsAvailable=false) instead of deleted so history survives. Both are 204; a
// missing id is 404. Admin-only.
public sealed class DeleteAdminMenuTests : DoenerControlTestBase
{
    public DeleteAdminMenuTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Hard_Delete_When_Unreferenced()
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
                IsInsider = false,
                SortOrder = 7,
                IsAvailable = true,
            }
        );

        var response = await admin.DeleteAsync($"{AdminMenuTestHelpers.MenuUrl}/falafel");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Null(await AdminMenuTestHelpers.FindMenuItemAsync(App, "falafel"));
    }

    [Fact]
    public async Task Should_Soft_Retire_When_Referenced_By_Order()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);
        await AdminMenuTestHelpers.SeedOrderReferencingAsync(App, "doener");

        var response = await admin.DeleteAsync($"{AdminMenuTestHelpers.MenuUrl}/doener");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        // The row still exists (FK intact) but is now unavailable.
        var stored = await AdminMenuTestHelpers.FindMenuItemAsync(App, "doener");
        Assert.NotNull(stored);
        Assert.False(stored!.IsAvailable);
    }

    [Fact]
    public async Task Should_Return404_When_Item_Missing()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        var response = await admin.DeleteAsync($"{AdminMenuTestHelpers.MenuUrl}/does-not-exist");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
