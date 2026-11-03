using System.Net;
using System.Net.Http.Json;
using Schulz.DoenerControl.Api.Endpoints.Admin.Fields;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Admin;

// Admin field + option CRUD scoped to the active store: create/list/update a field, add/update an
// option, soft-retire an option on delete, and enforce the reserved-key immutability the Tier
// contract depends on (the meat field and the kalb option can never be deleted). Also enforces
// Roles("Admin"). The harness auto-seeds the store + generic menu via GenericMenuSeeder.
public sealed class AdminFieldsTests : DoenerControlTestBase
{
    private const string FieldsUrl = "/api/admin/fields";

    public AdminFieldsTests(DoenerControlApp app)
        : base(app) { }

    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task Should_Create_And_List_When_Admin()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        var created = await admin.PostJsonAsync(
            FieldsUrl,
            new
            {
                Key = "drink",
                Label = "Getränk",
                Type = "single",
                Display = "dropdown",
                MaxLength = (int?)null,
            }
        );
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);

        var list = await admin.GetAsync(FieldsUrl);
        var body = await list.Content.ReadFromJsonAsync<GetAdminFieldsResponse>(Ct);

        Assert.Equal(HttpStatusCode.OK, list.StatusCode);
        Assert.Contains(
            body!.Items,
            item => item.Key == "drink" && item.Type == "single" && item.Display == "dropdown"
        );
    }

    [Fact]
    public async Task Should_Return409_When_Field_Key_Already_Exists()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        var response = await admin.PostJsonAsync(
            FieldsUrl,
            new
            {
                Key = "meat",
                Label = "Fleisch",
                Type = "single",
                Display = "segmented",
                MaxLength = (int?)null,
            }
        );

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Should_Return400_When_Type_Token_Unknown()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        var response = await admin.PostJsonAsync(
            FieldsUrl,
            new
            {
                Key = "size",
                Label = "Größe",
                Type = "radio",
                Display = "segmented",
                MaxLength = (int?)null,
            }
        );

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Should_Update_Editable_Field_Fields()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        var response = await admin.PutJsonAsync(
            $"{FieldsUrl}/sauce",
            new
            {
                Label = "Soßen",
                Display = "dropdown",
                MaxLength = (int?)null,
            }
        );
        var body = await response.Content.ReadFromJsonAsync<PutAdminFieldResponse>(Ct);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("Soßen", body!.Item.Label);
        Assert.Equal("dropdown", body.Item.Display);
        // Type stays put — it is immutable.
        Assert.Equal("multi", body.Item.Type);
    }

    [Fact]
    public async Task Should_Add_And_Update_Option()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);
        await admin.PostJsonAsync(
            FieldsUrl,
            new
            {
                Key = "topping",
                Label = "Topping",
                Type = "multi",
                Display = "chips",
                MaxLength = (int?)null,
            }
        );

        var added = await admin.PostJsonAsync(
            $"{FieldsUrl}/topping/options",
            new
            {
                Key = "cheese",
                Label = "Käse",
                Icon = "🧀",
                PriceDeltaCents = 100,
                SortOrder = 0,
                IsAvailable = true,
            }
        );
        var addedBody = await added.Content.ReadFromJsonAsync<PostAdminFieldOptionResponse>(Ct);

        Assert.Equal(HttpStatusCode.OK, added.StatusCode);
        Assert.Contains(
            addedBody!.Item.Options,
            option => option.Key == "cheese" && option.PriceDeltaCents == 100
        );

        var updated = await admin.PutJsonAsync(
            $"{FieldsUrl}/topping/options/cheese",
            new
            {
                Label = "Extra Käse",
                Icon = "🧀",
                PriceDeltaCents = 150,
                SortOrder = 0,
                IsAvailable = true,
            }
        );
        var updatedBody = await updated.Content.ReadFromJsonAsync<PutAdminFieldOptionResponse>(Ct);

        Assert.Equal(HttpStatusCode.OK, updated.StatusCode);
        Assert.Contains(
            updatedBody!.Item.Options,
            option => option.Key == "cheese" && option.Label == "Extra Käse"
        );
    }

    [Fact]
    public async Task Should_Return409_When_Option_Key_Already_Exists()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        var response = await admin.PostJsonAsync(
            $"{FieldsUrl}/meat/options",
            new
            {
                Key = "kalb",
                Label = "Kalb",
                Icon = (string?)null,
                PriceDeltaCents = 0,
                SortOrder = 0,
                IsAvailable = true,
            }
        );

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Should_Soft_Retire_Option_On_Delete()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);
        await admin.PostJsonAsync(
            FieldsUrl,
            new
            {
                Key = "sides",
                Label = "Beilagen",
                Type = "single",
                Display = "segmented",
                MaxLength = (int?)null,
            }
        );
        await admin.PostJsonAsync(
            $"{FieldsUrl}/sides/options",
            new
            {
                Key = "rice",
                Label = "Reis",
                Icon = (string?)null,
                PriceDeltaCents = 0,
                SortOrder = 0,
                IsAvailable = true,
            }
        );

        var response = await admin.DeleteAsync($"{FieldsUrl}/sides/options/rice");
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        // Soft-retired: the option row survives (label resolution) but is no longer available.
        var list = await admin.GetAsync(FieldsUrl);
        var body = await list.Content.ReadFromJsonAsync<GetAdminFieldsResponse>(Ct);
        var sides = body!.Items.Single(item => item.Key == "sides");
        var rice = sides.Options.Single(option => option.Key == "rice");
        Assert.False(rice.IsAvailable);
    }

    [Fact]
    public async Task Should_Delete_Unreferenced_Field()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);
        await admin.PostJsonAsync(
            FieldsUrl,
            new
            {
                Key = "spice",
                Label = "Schärfe",
                Type = "single",
                Display = "segmented",
                MaxLength = (int?)null,
            }
        );

        var response = await admin.DeleteAsync($"{FieldsUrl}/spice");
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        var list = await admin.GetAsync(FieldsUrl);
        var body = await list.Content.ReadFromJsonAsync<GetAdminFieldsResponse>(Ct);
        Assert.DoesNotContain(body!.Items, item => item.Key == "spice");
    }

    [Fact]
    public async Task Should_Reject_Deleting_Reserved_Field()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        var response = await admin.DeleteAsync($"{FieldsUrl}/meat");

        // Reserved fields can never be deleted (Tier contract) — Validation → 400.
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var list = await admin.GetAsync(FieldsUrl);
        var body = await list.Content.ReadFromJsonAsync<GetAdminFieldsResponse>(Ct);
        Assert.Contains(body!.Items, item => item.Key == "meat");
    }

    [Fact]
    public async Task Should_Reject_Deleting_Reserved_Option()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        var response = await admin.DeleteAsync($"{FieldsUrl}/meat/options/kalb");

        // The reserved kalb option can never be deleted (Tier contract) — Validation → 400.
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var list = await admin.GetAsync(FieldsUrl);
        var body = await list.Content.ReadFromJsonAsync<GetAdminFieldsResponse>(Ct);
        var meat = body!.Items.Single(item => item.Key == "meat");
        var kalb = meat.Options.Single(option => option.Key == "kalb");
        Assert.True(kalb.IsAvailable);
    }

    [Fact]
    public async Task Should_Return409_When_Deleting_Field_Referenced_By_Category()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        // The seeded non-reserved "extra" field is linked to the seeded "doener" category.
        var response = await admin.DeleteAsync($"{FieldsUrl}/extra");

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Should_Forbid_Employee()
    {
        var employee = await AdminUserTestHelpers.LoginAsEmployeeAsync(
            App,
            "s.yilmaz",
            "kollegePw22"
        );

        var response = await employee.GetAsync(FieldsUrl);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }
}
