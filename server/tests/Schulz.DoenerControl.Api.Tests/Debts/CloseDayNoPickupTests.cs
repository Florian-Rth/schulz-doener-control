using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Schulz.DoenerControl.Api.Endpoints.OrderDays;
using Schulz.DoenerControl.Infrastructure.Persistence;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Debts;

// Own fresh DB: the only non-pickup participant is the designated collector themselves, so closing
// the day crystallizes zero debts (the collector never owes themselves). The collector is seeded
// directly because they did not pick up, so the SetCollector flow does not apply.
public sealed class CloseDayNoPickupTests : DoenerControlTestBase
{
    public CloseDayNoPickupTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_CreateNoDebts_When_OnlyCollectorOrdered()
    {
        var chef = await DebtTestHelpers.LoginAsChefAsync(App);
        var dayId = await DebtTestHelpers.OpenTodayAsync(chef);
        await DebtTestHelpers.PlaceOrderAsync(chef, dayId, priceCents: 950, isPickup: false);

        var chefId = await DebtTestHelpers.UserIdAsync(App, "m.wagner");
        await DebtTestHelpers.SeedCollectorAsync(App, dayId, chefId);

        var closeResponse = await chef.PostAsync($"/api/order-days/{dayId}/close");
        var closeBody = await closeResponse.Content.ReadFromJsonAsync<CloseDayResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(0, closeBody!.DebtsCreated);

        using var scope = App.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var count = await database.Debts.CountAsync(
            d => d.OrderDayId == dayId,
            TestContext.Current.CancellationToken
        );
        Assert.Equal(0, count);
    }
}
