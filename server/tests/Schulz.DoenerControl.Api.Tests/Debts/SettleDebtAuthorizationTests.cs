using System.Net;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Debts;

// Own fresh DB: only the debtor or creditor may settle; a third party gets 404 (existence is not
// leaked) and the creditor is allowed to confirm the payment.
public sealed class SettleDebtAuthorizationTests : DoenerControlTestBase
{
    public SettleDebtAuthorizationTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Return404ForThirdParty_And_AllowCreditor()
    {
        var (_, debtId) = await DebtTestHelpers.CreateDebtToChefAsync(App);

        // Sara is neither debtor (Lukas) nor creditor (chef): 404, not 403, so she cannot probe it.
        var sara = await DebtTestHelpers.LoginAsColleagueAsync(App, "s.yilmaz", "kollegePw22");
        var thirdParty = await sara.PostAsync($"/api/debts/{debtId}/settle");
        Assert.Equal(HttpStatusCode.NotFound, thirdParty.StatusCode);

        // The creditor (chef) is a party to the debt and may confirm it.
        var chef = await DebtTestHelpers.LoginAsChefAsync(App);
        var creditor = await chef.PostAsync($"/api/debts/{debtId}/settle");
        Assert.Equal(HttpStatusCode.OK, creditor.StatusCode);
    }
}
