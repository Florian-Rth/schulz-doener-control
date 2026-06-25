using System.Net;
using System.Net.Http.Json;
using Schulz.DoenerControl.Api.Endpoints.Admin.PizzaVariants;
using Schulz.DoenerControl.Api.Tests.Orders;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Admin;

// DELETE /api/admin/pizza-variants/{id}: an unreferenced variant is hard-deleted (gone from the
// catalog); a variant referenced by an order line is soft-retired (row survives, IsAvailable=false)
// so the frozen order FK is never orphaned. Both are 204. 404 if no such variant. Admin-only.
public sealed class DeleteAdminPizzaVariantTests : DoenerControlTestBase
{
    public DeleteAdminPizzaVariantTests(DoenerControlApp app)
        : base(app) { }

    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task Should_Hard_Delete_Unreferenced_Variant()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        var create = await admin.PostJsonAsync(
            AdminPizzaVariantTestHelpers.VariantsUrl,
            new
            {
                Name = "Diavola",
                Icon = (string?)null,
                SortOrder = 6,
                IsAvailable = true,
            }
        );
        var created = await create.Content.ReadFromJsonAsync<PostAdminPizzaVariantResponse>(Ct);
        Assert.NotNull(created);

        var response = await admin.DeleteAsync(
            $"{AdminPizzaVariantTestHelpers.VariantsUrl}/{created!.Item.Id}"
        );

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        var stored = await AdminPizzaVariantTestHelpers.FindAsync(App, created.Item.Id);
        Assert.Null(stored);
    }

    [Fact]
    public async Task Should_Soft_Retire_Referenced_Variant()
    {
        // Place a pizza order that references the canonical Salami variant, then delete it.
        var chef = await OrderTestHelpers.LoginAsChefAsync(App);
        var dayId = await OrderTestHelpers.OpenTodayAsync(chef);
        var order = await chef.PutJsonAsync(
            $"/api/order-days/{dayId}/orders/mine",
            new
            {
                Lines = new[]
                {
                    new
                    {
                        ProductId = "pizza",
                        Meat = (string?)null,
                        PizzaVariant = (string?)AdminPizzaVariantTestHelpers.SalamiId,
                        Sauces = Array.Empty<string>(),
                        PriceCents = 900,
                        Extra = (string?)null,
                        Quantity = 1,
                    },
                },
                IsPickup = false,
            }
        );
        Assert.Equal(HttpStatusCode.OK, order.StatusCode);

        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);
        var response = await admin.DeleteAsync(
            $"{AdminPizzaVariantTestHelpers.VariantsUrl}/{AdminPizzaVariantTestHelpers.SalamiId}"
        );

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        var stored = await AdminPizzaVariantTestHelpers.FindAsync(
            App,
            new Guid(AdminPizzaVariantTestHelpers.SalamiId)
        );
        Assert.NotNull(stored);
        Assert.False(stored!.IsAvailable);
    }

    [Fact]
    public async Task Should_Return404_When_Variant_Missing()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        var response = await admin.DeleteAsync(
            $"{AdminPizzaVariantTestHelpers.VariantsUrl}/{Guid.NewGuid()}"
        );

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
