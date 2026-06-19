using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Schulz.DoenerControl.Api.Endpoints.OrderDays;
using Schulz.DoenerControl.Infrastructure.Persistence;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Debts;

// Own fresh DB: the collecting chef picks up, a non-pickup colleague's debt points to that collector
// with the correct cents. Closing the day requires a designated collector (the close-day auth rule),
// so the chef is the designated collector here.
public sealed class CloseDayDefaultCollectorTests : DoenerControlTestBase
{
    public CloseDayDefaultCollectorTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_PointDebtToCollector_When_DayClosed()
    {
        var chef = await DebtTestHelpers.LoginAsChefAsync(App);
        var dayId = await DebtTestHelpers.OpenTodayAsync(chef);
        await DebtTestHelpers.PlaceOrderAsync(chef, dayId, priceCents: 950, isPickup: true);

        var lukas = await DebtTestHelpers.LoginAsColleagueAsync(App, "l.brandt", "kollegePw11");
        await DebtTestHelpers.PlaceOrderAsync(lukas, dayId, priceCents: 750, isPickup: false);

        var chefId = await DebtTestHelpers.UserIdAsync(App, "m.wagner");
        var lukasId = await DebtTestHelpers.UserIdAsync(App, "l.brandt");
        await DebtTestHelpers.SetCollectorAsync(chef, dayId, chefId);

        var closeResponse = await chef.PostAsync($"/api/order-days/{dayId}/close");
        var closeBody = await closeResponse.Content.ReadFromJsonAsync<CloseDayResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(1, closeBody!.DebtsCreated);

        using var scope = App.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var debt = await database.Debts.SingleAsync(
            d => d.OrderDayId == dayId,
            TestContext.Current.CancellationToken
        );
        Assert.Equal(lukasId, debt.DebtorUserId);
        Assert.Equal(chefId, debt.CreditorUserId);
        Assert.Equal(750, debt.AmountCents);
    }
}
