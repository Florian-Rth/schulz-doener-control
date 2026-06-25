using System.Net;
using System.Net.Http.Json;
using Schulz.DoenerControl.Api.Endpoints.Admin.PizzaVariants;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Admin;

// POST /api/admin/pizza-variants creates a new variant, persists it, and validates a non-empty name.
// Admin-only.
public sealed class PostAdminPizzaVariantTests : DoenerControlTestBase
{
    public PostAdminPizzaVariantTests(DoenerControlApp app)
        : base(app) { }

    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task Should_Create_Variant()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        var response = await admin.PostJsonAsync(
            AdminPizzaVariantTestHelpers.VariantsUrl,
            new
            {
                Name = "Diavola",
                Icon = (string?)"local_fire_department",
                SortOrder = 6,
                IsAvailable = true,
            }
        );
        var body = await response.Content.ReadFromJsonAsync<PostAdminPizzaVariantResponse>(Ct);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.NotNull(body);
        Assert.Equal("Diavola", body!.Item.Name);
        Assert.Equal("local_fire_department", body.Item.Icon);
        Assert.Equal(6, body.Item.SortOrder);
        Assert.True(body.Item.IsAvailable);
        Assert.NotEqual(Guid.Empty, body.Item.Id);

        var stored = await AdminPizzaVariantTestHelpers.FindAsync(App, body.Item.Id);
        Assert.NotNull(stored);
        Assert.Equal("Diavola", stored!.Name);
    }

    [Fact]
    public async Task Should_Return400_When_Name_Empty()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        var response = await admin.PostJsonAsync(
            AdminPizzaVariantTestHelpers.VariantsUrl,
            new
            {
                Name = "",
                Icon = (string?)null,
                SortOrder = 6,
                IsAvailable = true,
            }
        );

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Should_Return400_When_SortOrder_Negative()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        var response = await admin.PostJsonAsync(
            AdminPizzaVariantTestHelpers.VariantsUrl,
            new
            {
                Name = "Diavola",
                Icon = (string?)null,
                SortOrder = -1,
                IsAvailable = true,
            }
        );

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
