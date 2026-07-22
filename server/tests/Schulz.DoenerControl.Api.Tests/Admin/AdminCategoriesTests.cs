using System.Net;
using System.Net.Http.Json;
using Schulz.DoenerControl.Api.Endpoints.Admin.Categories;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Admin;

// Admin category CRUD scoped to the active store: create/list/update, hard-delete an unreferenced
// category, reject deleting one a menu item references (409), replace field links via SetFields, and
// enforce Roles("Admin"). The harness auto-seeds the store + generic menu via GenericMenuSeeder.
public sealed class AdminCategoriesTests : DoenerControlTestBase
{
    private const string CategoriesUrl = "/api/admin/categories";

    public AdminCategoriesTests(DoenerControlApp app)
        : base(app) { }

    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task Should_Create_And_List_When_Admin()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        var created = await admin.PostJsonAsync(
            CategoriesUrl,
            new
            {
                Key = "burger",
                Name = "Burger",
                SortOrder = 9,
                IsAvailable = true,
            }
        );
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);

        var list = await admin.GetAsync(CategoriesUrl);
        var body = await list.Content.ReadFromJsonAsync<GetAdminCategoriesResponse>(Ct);

        Assert.Equal(HttpStatusCode.OK, list.StatusCode);
        Assert.NotNull(body);
        Assert.Contains(body!.Items, item => item.Key == "burger" && item.Name == "Burger");
    }

    [Fact]
    public async Task Should_Return409_When_Key_Already_Exists()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        var response = await admin.PostJsonAsync(
            CategoriesUrl,
            new
            {
                Key = "doener",
                Name = "Döner Zwei",
                SortOrder = 5,
                IsAvailable = true,
            }
        );

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Should_Update_Editable_Fields()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);
        await admin.PostJsonAsync(
            CategoriesUrl,
            new
            {
                Key = "salat",
                Name = "Salat",
                SortOrder = 8,
                IsAvailable = true,
            }
        );

        var response = await admin.PutJsonAsync(
            $"{CategoriesUrl}/salat",
            new
            {
                Name = "Salate",
                SortOrder = 3,
                IsAvailable = false,
            }
        );
        var body = await response.Content.ReadFromJsonAsync<PutAdminCategoryResponse>(Ct);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.Equal("Salate", body!.Item.Name);
        Assert.Equal(3, body.Item.SortOrder);
        Assert.False(body.Item.IsAvailable);
    }

    [Fact]
    public async Task Should_Return404_When_Updating_Missing_Category()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        var response = await admin.PutJsonAsync(
            $"{CategoriesUrl}/does-not-exist",
            new
            {
                Name = "Nichts",
                SortOrder = 0,
                IsAvailable = true,
            }
        );

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Should_Hard_Delete_When_Unreferenced()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);
        await admin.PostJsonAsync(
            CategoriesUrl,
            new
            {
                Key = "wraps",
                Name = "Wraps",
                SortOrder = 7,
                IsAvailable = true,
            }
        );

        var response = await admin.DeleteAsync($"{CategoriesUrl}/wraps");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        var list = await admin.GetAsync(CategoriesUrl);
        var body = await list.Content.ReadFromJsonAsync<GetAdminCategoriesResponse>(Ct);
        Assert.DoesNotContain(body!.Items, item => item.Key == "wraps");
    }

    [Fact]
    public async Task Should_Return409_When_Deleting_Category_Referenced_By_Menu_Item()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        // The seeded "doener" category is referenced by the seeded "doener" menu item.
        var response = await admin.DeleteAsync($"{CategoriesUrl}/doener");

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Should_Replace_Field_Links_On_SetFields()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);
        await admin.PostJsonAsync(
            CategoriesUrl,
            new
            {
                Key = "bowl",
                Name = "Bowl",
                SortOrder = 6,
                IsAvailable = true,
            }
        );

        var response = await admin.PutJsonAsync(
            $"{CategoriesUrl}/bowl/fields",
            new
            {
                Fields = new[]
                {
                    new
                    {
                        FieldKey = "meat",
                        SortOrder = 0,
                        IsRequired = true,
                    },
                    new
                    {
                        FieldKey = "extra",
                        SortOrder = 1,
                        IsRequired = false,
                    },
                },
            }
        );
        var body = await response.Content.ReadFromJsonAsync<PutAdminCategoryFieldsResponse>(Ct);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.Equal(2, body!.Item.Fields.Count);
        Assert.Equal("meat", body.Item.Fields[0].FieldKey);
        Assert.True(body.Item.Fields[0].IsRequired);
        Assert.Equal("extra", body.Item.Fields[1].FieldKey);
    }

    [Fact]
    public async Task Should_Return400_When_SetFields_References_Unknown_Field()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        var response = await admin.PutJsonAsync(
            $"{CategoriesUrl}/doener/fields",
            new
            {
                Fields = new[]
                {
                    new
                    {
                        FieldKey = "does-not-exist",
                        SortOrder = 0,
                        IsRequired = false,
                    },
                },
            }
        );

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Should_Forbid_Employee()
    {
        var employee = await AdminUserTestHelpers.LoginAsEmployeeAsync(
            App,
            "l.brandt",
            "kollegePw11"
        );

        var response = await employee.GetAsync(CategoriesUrl);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }
}
