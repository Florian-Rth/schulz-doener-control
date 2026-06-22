using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Schulz.DoenerControl.Core.Entities;
using Schulz.DoenerControl.Core.Enums;
using Schulz.DoenerControl.Infrastructure.Persistence;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.OrderDays;

// The partial unique index ("Status" <> Closed) still forbids two ACTIVE OrderDays on one calendar
// day — the same race protection the simultaneous-open path relies on. Own fresh DB per class.
public sealed class ActiveDayUniqueIndexTests : DoenerControlTestBase
{
    public ActiveDayUniqueIndexTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Reject_Second_Active_Day_For_Same_Date()
    {
        using var scope = App.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var chefId = await database
            .Users.Where(user => user.NormalizedUserName == "m.wagner")
            .Select(user => user.Id)
            .SingleAsync(TestContext.Current.CancellationToken);

        var date = new DateOnly(2031, 3, 14);
        database.OrderDays.Add(BuildActiveDay(chefId, date));
        await database.SaveChangesAsync(TestContext.Current.CancellationToken);

        database.OrderDays.Add(BuildActiveDay(chefId, date));

        await Assert.ThrowsAsync<DbUpdateException>(async () =>
            await database.SaveChangesAsync(TestContext.Current.CancellationToken)
        );
    }

    private static OrderDay BuildActiveDay(Guid openedByUserId, DateOnly date) =>
        new()
        {
            Id = Guid.NewGuid(),
            Date = date,
            Status = OrderDayStatus.Open,
            Synonym = "Drehspieß-Tasche",
            OrderCutoffAt = DateTimeOffset.UnixEpoch,
            OpenedByUserId = openedByUserId,
            OpenedAt = DateTimeOffset.UnixEpoch,
            ClosedAt = null,
            CollectorUserId = null,
        };
}
