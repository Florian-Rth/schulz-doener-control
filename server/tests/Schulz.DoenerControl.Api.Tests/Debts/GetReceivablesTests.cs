using System.Net;
using System.Net.Http.Json;
using Schulz.DoenerControl.Api.Endpoints.Debts;
using Schulz.DoenerControl.Api.Tests.Auth;
using Schulz.DoenerControl.Core.Enums;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Debts;

// Creditor-side ledger ("Was mir noch zusteht"): each test seeds its own fresh creditor and stages
// open/settled debts straight in the shared DB (no OrderDay spent). Mirrors GetDebtHistoryTests.
public sealed class GetReceivablesTests : DoenerControlTestBase
{
    private const string CreditorPassword = "Glaeubiger-Pw-1!";
    private static readonly DateTimeOffset Anchor = new(2026, 1, 1, 12, 0, 0, TimeSpan.Zero);

    public GetReceivablesTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Return_Unauthorized_When_Not_Authenticated()
    {
        var auth = new AuthTestClient(App.CreateClient());

        var response = await auth.GetAsync("/api/debts/receivables");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Should_List_Open_And_Settled_When_Caller_Is_Creditor()
    {
        var (creditor, creditorId) = await SeedCreditorAsync("c.both");
        var lukasId = await DebtTestHelpers.UserIdAsync(App, "l.brandt");
        var saraId = await DebtTestHelpers.UserIdAsync(App, "s.yilmaz");

        // Lukas still owes (open); Sara already paid back (settled).
        await DebtTestHelpers.SeedDebtAsync(
            App,
            debtorUserId: lukasId,
            creditorUserId: creditorId,
            amountCents: 750,
            reason: "Döner-Tag",
            status: PaymentStatus.Open,
            settledAt: null
        );
        await DebtTestHelpers.SeedDebtAsync(
            App,
            debtorUserId: saraId,
            creditorUserId: creditorId,
            amountCents: 800,
            reason: "Pizza-Tag",
            status: PaymentStatus.Settled,
            settledAt: Anchor
        );

        var ledger = await GetReceivablesAsync(creditor);

        Assert.Equal(1, ledger.OpenCount);
        Assert.Equal(750, ledger.OpenTotalCents);
        Assert.Equal("7,50 €", ledger.OpenTotalLabel);
        Assert.Equal(1, ledger.SettledCount);
        Assert.Equal(800, ledger.SettledTotalCents);
        Assert.Equal("8,00 €", ledger.SettledTotalLabel);

        Assert.Equal(2, ledger.Rows.Count);
        // Open rows come first, settled after.
        Assert.False(ledger.Rows[0].IsSettled);
        Assert.Equal("Lukas Brandt", ledger.Rows[0].DebtorName);
        Assert.True(ledger.Rows[1].IsSettled);
        Assert.Equal("Sara Yılmaz", ledger.Rows[1].DebtorName);
    }

    [Fact]
    public async Task Should_Return_Empty_When_Nobody_Owes_The_Caller()
    {
        var (creditor, _) = await SeedCreditorAsync("c.empty");

        var ledger = await GetReceivablesAsync(creditor);

        Assert.Equal(0, ledger.OpenCount);
        Assert.Equal(0, ledger.SettledCount);
        Assert.Empty(ledger.Rows);
    }

    [Fact]
    public async Task Should_Exclude_Debts_Where_Caller_Is_Debtor()
    {
        var (caller, callerId) = await SeedCreditorAsync("c.side");
        var lukasId = await DebtTestHelpers.UserIdAsync(App, "l.brandt");

        // Lukas owes the caller (caller = creditor) — belongs in receivables.
        await DebtTestHelpers.SeedDebtAsync(
            App,
            debtorUserId: lukasId,
            creditorUserId: callerId,
            amountCents: 750,
            reason: "mir-geschuldet",
            status: PaymentStatus.Open,
            settledAt: null
        );
        // The caller owes Lukas (caller = debtor) — must NOT leak into receivables.
        await DebtTestHelpers.SeedDebtAsync(
            App,
            debtorUserId: callerId,
            creditorUserId: lukasId,
            amountCents: 500,
            reason: "ich-schulde",
            status: PaymentStatus.Open,
            settledAt: null
        );

        var ledger = await GetReceivablesAsync(caller);

        var only = Assert.Single(ledger.Rows);
        Assert.Equal("mir-geschuldet", only.Reason);
        Assert.Equal("Lukas Brandt", only.DebtorName);
        Assert.DoesNotContain(ledger.Rows, row => row.Reason == "ich-schulde");
    }

    [Fact]
    public async Task Should_Include_AdHoc_Receivable_With_Null_DayLabel()
    {
        var (creditor, creditorId) = await SeedCreditorAsync("c.adhoc");
        var lukasId = await DebtTestHelpers.UserIdAsync(App, "l.brandt");

        // Ad-hoc debt has no order day -> DayLabel must be null (and must not throw).
        await DebtTestHelpers.SeedDebtAsync(
            App,
            debtorUserId: lukasId,
            creditorUserId: creditorId,
            amountCents: 300,
            reason: "Ayran-Schulden",
            status: PaymentStatus.Open,
            settledAt: null
        );

        var ledger = await GetReceivablesAsync(creditor);

        var only = Assert.Single(ledger.Rows);
        Assert.Null(only.DayLabel);
        Assert.Equal("Ayran-Schulden", only.Reason);
    }

    private async Task<(AuthTestClient Client, Guid Id)> SeedCreditorAsync(string username)
    {
        var id = await App.Services.SeedUserAsync(
            username: username,
            displayName: "Test Gläubiger",
            password: CreditorPassword,
            mustChangePassword: false,
            ct: TestContext.Current.CancellationToken
        );
        var client = await DebtTestHelpers.LoginAsync(App, username, CreditorPassword);
        return (client, id);
    }

    private static async Task<GetReceivablesResponse> GetReceivablesAsync(AuthTestClient auth)
    {
        var response = await auth.GetAsync("/api/debts/receivables");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<GetReceivablesResponse>(
            TestContext.Current.CancellationToken
        );
        return body!;
    }
}
