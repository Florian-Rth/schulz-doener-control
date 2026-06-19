using System.Net;
using System.Net.Http.Json;
using Schulz.DoenerControl.Api.Endpoints.Admin.Users;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Admin;

public sealed class GetAdminUsersTests : DoenerControlTestBase
{
    public GetAdminUsersTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_List_All_Seeded_Users_With_Admin_Fields()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        var response = await admin.GetAsync(AdminUserTestHelpers.UsersUrl);
        var body = await response.Content.ReadFromJsonAsync<GetAdminUsersResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);

        // 1 admin (Chef) + 12 standard colleagues are seeded per fixture.
        Assert.Equal(13, body!.Users.Count);

        var chef = body.Users.Single(user => user.Username == "m.wagner");
        Assert.Equal("Markus Wagner", chef.DisplayName);
        Assert.Equal("Admin", chef.Role);
        Assert.True(chef.IsActive);
        Assert.False(chef.MustChangePassword);
        Assert.Equal("MarkusWagnerHB", chef.PayPalHandle);

        var colleague = body.Users.Single(user => user.Username == "t.klein");
        Assert.Equal("Employee", colleague.Role);
        Assert.True(colleague.MustChangePassword);
        Assert.Null(colleague.PayPalHandle);
    }
}
