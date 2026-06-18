using System.Net;
using System.Net.Http.Json;
using Schulz.DoenerControl.Api.Endpoints.Debts;
using Schulz.DoenerControl.Api.Tests.Auth;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Debts;

public sealed class PostDebtTests : DoenerControlTestBase
{
    public PostDebtTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Return_Unauthorized_When_Not_Authenticated()
    {
        var auth = new AuthTestClient(App.CreateClient());

        var response = await auth.PostJsonAsync(
            "/api/debts",
            new
            {
                CreditorUserId = Guid.NewGuid(),
                AmountCents = 250,
                Reason = "Ayran-Schulden",
            }
        );

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Should_CreateOpenAdHocDebt_When_Valid()
    {
        // The caller (chef) records that he owes Lukas an Ayran — no order behind it.
        var chef = await DebtTestHelpers.LoginAsChefAsync(App);
        var lukasId = await DebtTestHelpers.UserIdAsync(App, "l.brandt");

        var response = await chef.PostJsonAsync(
            "/api/debts",
            new
            {
                CreditorUserId = lukasId,
                AmountCents = 250,
                Reason = "Ayran-Schulden",
            }
        );
        var body = await response.Content.ReadFromJsonAsync<PostDebtResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.Equal("Open", body!.Debt.Status);
        Assert.Equal(250, body.Debt.AmountCents);
        Assert.Equal("Ayran-Schulden", body.Debt.Reason);

        // It shows up on the chef's "what I owe" list, with no day label (ad-hoc).
        var mine = await chef.GetAsync("/api/debts/mine");
        var mineBody = await mine.Content.ReadFromJsonAsync<GetMyDebtsResponse>(
            TestContext.Current.CancellationToken
        );
        var row = Assert.Single(mineBody!.Debts);
        Assert.Equal("Lukas Brandt", row.PersonName);
        Assert.Null(row.DayLabel);
    }

    [Fact]
    public async Task Should_Return400_When_CreditorIsCaller()
    {
        var chef = await DebtTestHelpers.LoginAsChefAsync(App);
        var chefId = await DebtTestHelpers.UserIdAsync(App, "m.wagner");

        var response = await chef.PostJsonAsync(
            "/api/debts",
            new
            {
                CreditorUserId = chefId,
                AmountCents = 250,
                Reason = "Ayran-Schulden",
            }
        );

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Should_Return404_When_CreditorUnknown()
    {
        var chef = await DebtTestHelpers.LoginAsChefAsync(App);

        var response = await chef.PostJsonAsync(
            "/api/debts",
            new
            {
                CreditorUserId = Guid.NewGuid(),
                AmountCents = 250,
                Reason = "Ayran-Schulden",
            }
        );

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Should_Return400_When_AmountNotPositive()
    {
        var chef = await DebtTestHelpers.LoginAsChefAsync(App);
        var lukasId = await DebtTestHelpers.UserIdAsync(App, "l.brandt");

        var response = await chef.PostJsonAsync(
            "/api/debts",
            new
            {
                CreditorUserId = lukasId,
                AmountCents = 0,
                Reason = "Ayran-Schulden",
            }
        );

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
