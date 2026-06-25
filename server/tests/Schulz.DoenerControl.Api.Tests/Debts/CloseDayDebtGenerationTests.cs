using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Schulz.DoenerControl.Api.Endpoints.Debts;
using Schulz.DoenerControl.Api.Endpoints.OrderDays;
using Schulz.DoenerControl.Core.Enums;
using Schulz.DoenerControl.Infrastructure.Persistence;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Debts;

// The headline F10 flow (own fresh DB): open a day, add orders + a collector, close → one open Debt
// per non-pickup payer → the collector with the correct cents; settle → Settled; GET /api/debts/mine
// lists the caller's open debts. One close per class because the unique Date index means one
// OrderDay per calendar day per database.
public sealed class CloseDayDebtGenerationTests : DoenerControlTestBase
{
    public CloseDayDebtGenerationTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_CreateOneOpenDebtPerNonPickupPayerToCollector_When_DayClosed()
    {
        // Chef picks up (and is the collector), two colleagues are non-pickup payers.
        var chef = await DebtTestHelpers.LoginAsChefAsync(App);
        var dayId = await DebtTestHelpers.OpenTodayAsync(chef);
        await DebtTestHelpers.PlaceOrderAsync(chef, dayId, priceCents: 950, isPickup: true);

        var lukas = await DebtTestHelpers.LoginAsColleagueAsync(App, "l.brandt", "kollegePw11");
        await DebtTestHelpers.PlaceOrderAsync(lukas, dayId, priceCents: 750, isPickup: false);

        var sara = await DebtTestHelpers.LoginAsColleagueAsync(App, "s.yilmaz", "kollegePw22");
        await DebtTestHelpers.PlaceOrderAsync(sara, dayId, priceCents: 800, isPickup: false);

        var chefId = await DebtTestHelpers.UserIdAsync(App, "m.wagner");
        var lukasId = await DebtTestHelpers.UserIdAsync(App, "l.brandt");
        await DebtTestHelpers.SetCollectorAsync(chef, dayId, chefId);

        var closeResponse = await chef.PostAsync($"/api/order-days/{dayId}/close");
        var closeBody = await closeResponse.Content.ReadFromJsonAsync<CloseDayResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, closeResponse.StatusCode);
        Assert.NotNull(closeBody);
        // One debt per non-pickup payer (Lukas + Sara); the collecting chef owes nothing.
        Assert.Equal(2, closeBody!.DebtsCreated);

        Guid lukasDebtId;
        using (var scope = App.Services.CreateScope())
        {
            var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var debts = await database
                .Debts.Where(debt => debt.OrderDayId == dayId)
                .ToListAsync(TestContext.Current.CancellationToken);

            Assert.Equal(2, debts.Count);
            Assert.All(debts, debt => Assert.Equal(chefId, debt.CreditorUserId));
            Assert.All(debts, debt => Assert.Equal(PaymentStatus.Open, debt.Status));
            Assert.All(debts, debt => Assert.Equal("Döner-Tag", debt.Reason));
            Assert.All(debts, debt => Assert.NotNull(debt.OrderId));

            var lukasDebt = debts.Single(debt => debt.DebtorUserId == lukasId);
            Assert.Equal(750, lukasDebt.AmountCents);
            lukasDebtId = lukasDebt.Id;
        }

        // Lukas sees his open debt to the chef on GET /api/debts/mine.
        var mineResponse = await lukas.GetAsync("/api/debts/mine");
        var mine = await mineResponse.Content.ReadFromJsonAsync<GetMyDebtsResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, mineResponse.StatusCode);
        Assert.NotNull(mine);
        Assert.Equal(1, mine!.OpenCount);
        Assert.Equal(750, mine.TotalCents);
        var row = Assert.Single(mine.Debts);
        Assert.Equal(lukasDebtId, row.Id);
        Assert.Equal("Markus Wagner", row.PersonName);
        Assert.Equal(750, row.AmountCents);
        Assert.Equal("Döner-Tag", row.Reason);
        // Chef has a PayPal handle seeded → the creditor's pay link is reconstructed with the amount.
        Assert.Equal($"{TestSeeding.ChefPayPalLink}/7.50EUR", row.PaypalUrl);
        Assert.Equal("7,50 €", row.AmountLabel);

        // Settling the debt flips it to Settled and drops it from the open list.
        var settleResponse = await lukas.PostAsync($"/api/debts/{row.Id}/settle");
        var settled = await settleResponse.Content.ReadFromJsonAsync<SettleDebtResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, settleResponse.StatusCode);
        Assert.NotNull(settled);
        Assert.Equal("Settled", settled!.Debt.Status);
        Assert.NotNull(settled.Debt.SettledAt);

        var afterResponse = await lukas.GetAsync("/api/debts/mine");
        var after = await afterResponse.Content.ReadFromJsonAsync<GetMyDebtsResponse>(
            TestContext.Current.CancellationToken
        );
        Assert.Equal(0, after!.OpenCount);
        Assert.Empty(after.Debts);
    }
}
