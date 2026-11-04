using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Schulz.DoenerControl.Application.OrderDays;
using Schulz.DoenerControl.Application.Push;
using Schulz.DoenerControl.Infrastructure.OrderDays;
using Schulz.DoenerControl.Infrastructure.Persistence;
using Schulz.DoenerControl.Infrastructure.PickupWheel;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.PickupWheel;

internal static class PickupWheelTestHelpers
{
    // Before the harness's fixed 08:00 Berlin instant, so the deadline has passed.
    public static readonly TimeOnly PassedDeadline = new(7, 30);

    // After the fixed 08:00 instant: the production default 12:00.
    public static readonly TimeOnly UpcomingDeadline = new(12, 0);

    // Runs the worker's job once against the fixture database with a chosen deadline, so the test
    // decides whether "it is past 12" instead of the wall clock.
    public static async Task<bool> SpinIfDueAsync(DoenerControlApp app, TimeOnly deadline)
    {
        using var scope = app.Services.CreateScope();
        var provider = scope.ServiceProvider;
        var service = new PickupWheelService(
            provider.GetRequiredService<AppDbContext>(),
            provider.GetRequiredService<OrderDayClock>(),
            provider.GetRequiredService<IOrderDayService>(),
            provider.GetRequiredService<IPushBroadcaster>(),
            Options.Create(new PickupWheelOptions { DeadlineLocalTime = deadline })
        );
        return await service.SpinIfDueAsync(TestContext.Current.CancellationToken);
    }

    public static async Task<Guid?> CollectorIdAsync(DoenerControlApp app, Guid dayId)
    {
        using var scope = app.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        return await database
            .OrderDays.Where(day => day.Id == dayId)
            .Select(day => day.CollectorUserId)
            .SingleAsync(TestContext.Current.CancellationToken);
    }

    public static async Task<int> SpinCountAsync(DoenerControlApp app, Guid dayId)
    {
        using var scope = app.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        return await database.PickupWheelSpins.CountAsync(
            spin => spin.OrderDayId == dayId,
            TestContext.Current.CancellationToken
        );
    }
}
