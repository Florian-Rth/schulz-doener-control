using System.Net;
using System.Net.Http.Json;
using Schulz.DoenerControl.Api.Endpoints.Debts;
using Schulz.DoenerControl.Api.Tests.Auth;
using Schulz.DoenerControl.Core.Enums;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Debts;

// Own fresh DB, but one DB is shared across this class's methods — so each test seeds its OWN
// bespoke debtor (a fresh user per test) and stages settled/open debts straight in the database
// against it. That isolates the methods from one another while letting them assert the "Meine
// letzten Zahlungen" history on ordering, the settled-only filter, the take cap, and the
// debtor-only side without spending the single OrderDay the unique Date index allows per fixture.
public sealed class GetDebtHistoryTests : DoenerControlTestBase
{
    private const string DebtorPassword = "Schuldner-Pw-1!";

    private static readonly DateTimeOffset Anchor = new(2026, 1, 1, 12, 0, 0, TimeSpan.Zero);

    public GetDebtHistoryTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Return_Unauthorized_When_Not_Authenticated()
    {
        var auth = new AuthTestClient(App.CreateClient());

        var response = await auth.GetAsync("/api/debts/history");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Should_ReturnSettledPaymentsNewestFirst_DescribingTheCreditor()
    {
        var (debtor, debtorId) = await SeedDebtorAsync("d.ordering");
        var lukasId = await DebtTestHelpers.UserIdAsync(App, "l.brandt");
        var saraId = await DebtTestHelpers.UserIdAsync(App, "s.yilmaz");

        // The debtor paid Lukas first, then Sara later — newest by SettledAt is Sara.
        await DebtTestHelpers.SeedDebtAsync(
            App,
            debtorUserId: debtorId,
            creditorUserId: lukasId,
            amountCents: 750,
            reason: "Döner-Tag",
            status: PaymentStatus.Settled,
            settledAt: Anchor
        );
        await DebtTestHelpers.SeedDebtAsync(
            App,
            debtorUserId: debtorId,
            creditorUserId: saraId,
            amountCents: 1250,
            reason: "Pizza-Tag",
            status: PaymentStatus.Settled,
            settledAt: Anchor.AddHours(3)
        );

        var history = await GetHistoryAsync(debtor);

        Assert.Equal(2, history.Payments.Count);

        var newest = history.Payments[0];
        Assert.Equal("Sara Yılmaz", newest.PersonName);
        Assert.Equal("SY", newest.Initials);
        Assert.Equal("#ED701C", newest.AvatarColorHex);
        Assert.Equal(1250, newest.AmountCents);
        Assert.Equal("12,50 €", newest.AmountLabel);
        Assert.Equal("Pizza-Tag", newest.Reason);

        var older = history.Payments[1];
        Assert.Equal("Lukas Brandt", older.PersonName);
        Assert.Equal(750, older.AmountCents);
    }

    [Fact]
    public async Task Should_ExcludeOpenDebts_From_History()
    {
        var (debtor, debtorId) = await SeedDebtorAsync("d.open");
        var lukasId = await DebtTestHelpers.UserIdAsync(App, "l.brandt");
        var saraId = await DebtTestHelpers.UserIdAsync(App, "s.yilmaz");

        await DebtTestHelpers.SeedDebtAsync(
            App,
            debtorUserId: debtorId,
            creditorUserId: lukasId,
            amountCents: 750,
            reason: "beglichen",
            status: PaymentStatus.Settled,
            settledAt: Anchor
        );
        await DebtTestHelpers.SeedDebtAsync(
            App,
            debtorUserId: debtorId,
            creditorUserId: saraId,
            amountCents: 999,
            reason: "noch offen",
            status: PaymentStatus.Open,
            settledAt: null
        );

        var history = await GetHistoryAsync(debtor);

        var only = Assert.Single(history.Payments);
        Assert.Equal("beglichen", only.Reason);
        Assert.DoesNotContain(history.Payments, p => p.Reason == "noch offen");
    }

    [Fact]
    public async Task Should_CapAtTheLastTen_KeepingTheNewest()
    {
        var (debtor, debtorId) = await SeedDebtorAsync("d.cap");
        var lukasId = await DebtTestHelpers.UserIdAsync(App, "l.brandt");

        // 12 settled payments; only the 10 newest must come back, oldest two dropped.
        for (var i = 0; i < 12; i++)
        {
            await DebtTestHelpers.SeedDebtAsync(
                App,
                debtorUserId: debtorId,
                creditorUserId: lukasId,
                amountCents: 100 + i,
                reason: $"Zahlung {i}",
                status: PaymentStatus.Settled,
                settledAt: Anchor.AddHours(i)
            );
        }

        var history = await GetHistoryAsync(debtor);

        Assert.Equal(10, history.Payments.Count);
        // Newest first: Zahlung 11 (Anchor+11h) down to Zahlung 2 (Anchor+2h).
        Assert.Equal("Zahlung 11", history.Payments[0].Reason);
        Assert.Equal("Zahlung 2", history.Payments[^1].Reason);
        Assert.DoesNotContain(history.Payments, p => p.Reason == "Zahlung 1");
        Assert.DoesNotContain(history.Payments, p => p.Reason == "Zahlung 0");
    }

    [Fact]
    public async Task Should_ReturnOnlyDebtsWhereCallerIsDebtor_NotCreditor()
    {
        var (debtor, debtorId) = await SeedDebtorAsync("d.side");
        var lukasId = await DebtTestHelpers.UserIdAsync(App, "l.brandt");

        // The caller paid Lukas (caller = debtor) — belongs in the caller's history.
        await DebtTestHelpers.SeedDebtAsync(
            App,
            debtorUserId: debtorId,
            creditorUserId: lukasId,
            amountCents: 750,
            reason: "ich-habe-gezahlt",
            status: PaymentStatus.Settled,
            settledAt: Anchor
        );
        // Lukas paid the caller (caller = creditor) — must NOT leak into the caller's history.
        await DebtTestHelpers.SeedDebtAsync(
            App,
            debtorUserId: lukasId,
            creditorUserId: debtorId,
            amountCents: 500,
            reason: "mir-wurde-gezahlt",
            status: PaymentStatus.Settled,
            settledAt: Anchor.AddHours(1)
        );

        var history = await GetHistoryAsync(debtor);

        var only = Assert.Single(history.Payments);
        Assert.Equal("ich-habe-gezahlt", only.Reason);
        Assert.Equal("Lukas Brandt", only.PersonName);
    }

    // Seeds a fresh, ready-to-use debtor (login-able immediately, no forced password change) and
    // returns its authenticated client plus id, so each test owns an isolated debtor in the shared DB.
    private async Task<(AuthTestClient Client, Guid Id)> SeedDebtorAsync(string username)
    {
        var id = await App.Services.SeedUserAsync(
            username: username,
            displayName: "Test Schuldner",
            password: DebtorPassword,
            mustChangePassword: false,
            ct: TestContext.Current.CancellationToken
        );
        var client = await DebtTestHelpers.LoginAsync(App, username, DebtorPassword);
        return (client, id);
    }

    private static async Task<GetDebtHistoryResponse> GetHistoryAsync(AuthTestClient auth)
    {
        var response = await auth.GetAsync("/api/debts/history");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<GetDebtHistoryResponse>(
            TestContext.Current.CancellationToken
        );
        return body!;
    }
}
