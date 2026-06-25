using System.Net;
using System.Net.Http.Json;
using Schulz.DoenerControl.Api.Endpoints.Admin.PizzaVariants;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Admin;

// GET /api/admin/pizza-variants lists the seeded canonical variants in SortOrder, including their
// id/name/icon/availability. Admin-only.
public sealed class GetAdminPizzaVariantsTests : DoenerControlTestBase
{
    public GetAdminPizzaVariantsTests(DoenerControlApp app)
        : base(app) { }

    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task Should_List_Canonical_Variants_In_Sort_Order()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        var response = await admin.GetAsync(AdminPizzaVariantTestHelpers.VariantsUrl);
        var body = await response.Content.ReadFromJsonAsync<GetAdminPizzaVariantsResponse>(Ct);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.Equal(
            ["Salami", "Margherita", "Funghi", "Tonno", "Hawaii"],
            body!.Items.Select(item => item.Name).ToArray()
        );
        Assert.All(body.Items, item => Assert.True(item.IsAvailable));
        Assert.All(body.Items, item => Assert.Null(item.Icon));

        var salami = body.Items[0];
        Assert.Equal(new Guid(AdminPizzaVariantTestHelpers.SalamiId), salami.Id);
        Assert.Equal(1, salami.SortOrder);
    }
}
