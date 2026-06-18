using System.Net;
using System.Net.Http.Json;
using Schulz.DoenerControl.Api.Endpoints.Debts;
using Schulz.DoenerControl.Api.Tests.Auth;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Debts;

// Own fresh DB. A single closed day with the chef collecting from two colleagues exercises the
// debtor list (/mine), the creditor list (/owed-to-me), and the settled-exclusion rule against one
// real ledger — one close per class because the unique Date index allows one OrderDay per day.
public sealed class GetDebtsTests : DoenerControlTestBase
{
    public GetDebtsTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Return_Unauthorized_When_Not_Authenticated()
    {
        var auth = new AuthTestClient(App.CreateClient());

        var response = await auth.GetAsync("/api/debts/mine");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Should_ListOpenDebtsPerSide_And_ExcludeSettled()
    {
        var chef = await DebtTestHelpers.LoginAsChefAsync(App);
        var dayId = await DebtTestHelpers.OpenTodayAsync(chef);
        await DebtTestHelpers.PlaceOrderAsync(chef, dayId, priceCents: 950, isPickup: true);

        var lukas = await DebtTestHelpers.LoginAsColleagueAsync(App, "l.brandt", "kollegePw11");
        await DebtTestHelpers.PlaceOrderAsync(lukas, dayId, priceCents: 750, isPickup: false);
        var sara = await DebtTestHelpers.LoginAsColleagueAsync(App, "s.yilmaz", "kollegePw22");
        await DebtTestHelpers.PlaceOrderAsync(sara, dayId, priceCents: 800, isPickup: false);

        var chefId = await DebtTestHelpers.UserIdAsync(App, "m.wagner");
        await DebtTestHelpers.SetCollectorAsync(chef, dayId, chefId);
        await chef.PostAsync($"/api/order-days/{dayId}/close");

        // Debtor view: Sara owes the chef her own 8,00 €.
        var saraDebts = await GetMineAsync(sara);
        Assert.Equal(1, saraDebts.OpenCount);
        Assert.Equal(800, saraDebts.TotalCents);
        Assert.Equal("8,00 €", saraDebts.TotalLabel);
        var saraRow = Assert.Single(saraDebts.Debts);
        Assert.Equal("Markus Wagner", saraRow.PersonName);
        Assert.Equal("MW", saraRow.Initials);

        // The chef owes nothing; everything is owed TO him.
        var chefMine = await GetMineAsync(chef);
        Assert.Equal(0, chefMine.OpenCount);

        // Creditor view: the chef collects 7,50 + 8,00 from the two colleagues.
        var owed = await chef.GetAsync("/api/debts/owed-to-me");
        var owedBody = await owed.Content.ReadFromJsonAsync<GetDebtsOwedToMeResponse>(
            TestContext.Current.CancellationToken
        );
        Assert.Equal(HttpStatusCode.OK, owed.StatusCode);
        Assert.Equal(2, owedBody!.OpenCount);
        Assert.Equal(1550, owedBody.TotalCents);
        Assert.Equal("15,50 €", owedBody.TotalLabel);
        Assert.Contains(owedBody.Debts, row => row.PersonName == "Lukas Brandt");
        Assert.Contains(owedBody.Debts, row => row.PersonName == "Sara Yılmaz");

        // After Lukas settles, his row drops from his own list and the chef's collect-total shrinks.
        var lukasMine = await GetMineAsync(lukas);
        await lukas.PostAsync($"/api/debts/{lukasMine.Debts[0].Id}/settle");

        var lukasAfter = await GetMineAsync(lukas);
        Assert.Equal(0, lukasAfter.OpenCount);
        Assert.Empty(lukasAfter.Debts);

        var owedAfter = await chef.GetAsync("/api/debts/owed-to-me");
        var owedAfterBody = await owedAfter.Content.ReadFromJsonAsync<GetDebtsOwedToMeResponse>(
            TestContext.Current.CancellationToken
        );
        Assert.Equal(1, owedAfterBody!.OpenCount);
        Assert.Equal(800, owedAfterBody.TotalCents);
    }

    private static async Task<GetMyDebtsResponse> GetMineAsync(AuthTestClient auth)
    {
        var response = await auth.GetAsync("/api/debts/mine");
        var body = await response.Content.ReadFromJsonAsync<GetMyDebtsResponse>(
            TestContext.Current.CancellationToken
        );
        return body!;
    }
}
