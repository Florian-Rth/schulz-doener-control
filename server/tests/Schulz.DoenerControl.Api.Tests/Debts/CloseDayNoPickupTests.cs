using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Schulz.DoenerControl.Api.Endpoints.OrderDays;
using Schulz.DoenerControl.Infrastructure.Persistence;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Debts;

// Own fresh DB: with no pickup at all, no collector can be resolved, so closing the day crystallizes
// zero debts (nobody is reimbursing anyone).
public sealed class CloseDayNoPickupTests : DoenerControlTestBase
{
    public CloseDayNoPickupTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_CreateNoDebts_When_NobodyPicksUp()
    {
        var chef = await DebtTestHelpers.LoginAsChefAsync(App);
        var dayId = await DebtTestHelpers.OpenTodayAsync(chef);
        await DebtTestHelpers.PlaceOrderAsync(chef, dayId, priceCents: 950, isPickup: false);

        var lukas = await DebtTestHelpers.LoginAsColleagueAsync(App, "l.brandt", "kollegePw11");
        await DebtTestHelpers.PlaceOrderAsync(lukas, dayId, priceCents: 750, isPickup: false);

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
