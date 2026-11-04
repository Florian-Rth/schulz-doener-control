using Schulz.DoenerControl.Application.PickupWheel;

namespace Schulz.DoenerControl.Api.Background;

// Checks twice a minute whether today's Döner-Tag needs the Abholer-Glücksrad. The service decides
// (deadline passed, nobody volunteered, not spun yet); this loop only provides the heartbeat.
public sealed class PickupWheelWorker : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromSeconds(30);

    private readonly IServiceScopeFactory scopeFactory;
    private readonly TimeProvider timeProvider;
    private readonly ILogger<PickupWheelWorker> logger;

    public PickupWheelWorker(
        IServiceScopeFactory scopeFactory,
        TimeProvider timeProvider,
        ILogger<PickupWheelWorker> logger
    )
    {
        this.scopeFactory = scopeFactory;
        this.timeProvider = timeProvider;
        this.logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(Interval, timeProvider);
        do
        {
            await SpinIfDueAsync(stoppingToken);
        } while (await timer.WaitForNextTickAsync(stoppingToken));
    }

    private async Task SpinIfDueAsync(CancellationToken ct)
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var wheel = scope.ServiceProvider.GetRequiredService<IPickupWheelService>();
            if (await wheel.SpinIfDueAsync(ct))
                logger.LogInformation("Abholer-Glücksrad hat gedreht.");
        }
        catch (Exception exception) when (!ct.IsCancellationRequested)
        {
            // A failed tick must never kill the worker; the next tick simply tries again.
            logger.LogError(exception, "Abholer-Glücksrad konnte nicht drehen.");
        }
    }
}
