using System.Net;
using Schulz.DoenerControl.Api.Tests.Auth;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Debts;

// Settle cases that need no closed day. Scenarios that require a generated debt live in their own
// single-close classes (CloseDay* / SettleDebt*) because one OrderDay exists per day per database.
public sealed class PostSettleDebtTests : DoenerControlTestBase
{
    public PostSettleDebtTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Return_Unauthorized_When_Not_Authenticated()
    {
        var auth = new AuthTestClient(App.CreateClient());

        var response = await auth.PostAsync($"/api/debts/{Guid.NewGuid()}/settle");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Should_Return404_When_DebtNotFound()
    {
        var chef = await DebtTestHelpers.LoginAsChefAsync(App);

        var response = await chef.PostAsync($"/api/debts/{Guid.NewGuid()}/settle");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
