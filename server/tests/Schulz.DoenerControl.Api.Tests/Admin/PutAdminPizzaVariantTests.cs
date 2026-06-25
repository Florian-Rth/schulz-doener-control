using System.Net;
using System.Net.Http.Json;
using Schulz.DoenerControl.Api.Endpoints.Admin.PizzaVariants;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Admin;

// PUT /api/admin/pizza-variants/{id} edits a variant's editable fields. 404 if no such variant.
// Admin-only.
public sealed class PutAdminPizzaVariantTests : DoenerControlTestBase
{
    public PutAdminPizzaVariantTests(DoenerControlApp app)
        : base(app) { }

    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task Should_Update_Variant()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        var response = await admin.PutJsonAsync(
            $"{AdminPizzaVariantTestHelpers.VariantsUrl}/{AdminPizzaVariantTestHelpers.SalamiId}",
            new
            {
                Name = "Salami Piccante",
                Icon = (string?)"whatshot",
                SortOrder = 9,
                IsAvailable = false,
            }
        );
        var body = await response.Content.ReadFromJsonAsync<PutAdminPizzaVariantResponse>(Ct);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.Equal("Salami Piccante", body!.Item.Name);
        Assert.Equal("whatshot", body.Item.Icon);
        Assert.Equal(9, body.Item.SortOrder);
        Assert.False(body.Item.IsAvailable);

        var stored = await AdminPizzaVariantTestHelpers.FindAsync(
            App,
            new Guid(AdminPizzaVariantTestHelpers.SalamiId)
        );
        Assert.NotNull(stored);
        Assert.Equal("Salami Piccante", stored!.Name);
        Assert.False(stored.IsAvailable);
    }

    [Fact]
    public async Task Should_Return404_When_Variant_Missing()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        var response = await admin.PutJsonAsync(
            $"{AdminPizzaVariantTestHelpers.VariantsUrl}/{Guid.NewGuid()}",
            new
            {
                Name = "Geistersorte",
                Icon = (string?)null,
                SortOrder = 1,
                IsAvailable = true,
            }
        );

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Should_Return400_When_Name_Empty()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        var response = await admin.PutJsonAsync(
            $"{AdminPizzaVariantTestHelpers.VariantsUrl}/{AdminPizzaVariantTestHelpers.SalamiId}",
            new
            {
                Name = "",
                Icon = (string?)null,
                SortOrder = 1,
                IsAvailable = true,
            }
        );

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
