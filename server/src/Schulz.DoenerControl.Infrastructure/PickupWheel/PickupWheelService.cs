using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Schulz.DoenerControl.Application.Calculators;
using Schulz.DoenerControl.Application.OrderDays;
using Schulz.DoenerControl.Application.PickupWheel;
using Schulz.DoenerControl.Application.Push;
using Schulz.DoenerControl.Core;
using Schulz.DoenerControl.Core.Entities;
using Schulz.DoenerControl.Core.Enums;
using Schulz.DoenerControl.Infrastructure.OrderDays;
using Schulz.DoenerControl.Infrastructure.Orders;
using Schulz.DoenerControl.Infrastructure.Persistence;

namespace Schulz.DoenerControl.Infrastructure.PickupWheel;

// The Abholer-Glücksrad. The server draws the winner (so every client's wheel lands on the same
// person and the push can name them); the clients only animate towards it.
public sealed class PickupWheelService : IPickupWheelService
{
    private readonly AppDbContext database;
    private readonly OrderDayClock clock;
    private readonly IOrderDayService orderDayService;
    private readonly IPushBroadcaster pushBroadcaster;
    private readonly PickupWheelOptions options;

    public PickupWheelService(
        AppDbContext database,
        OrderDayClock clock,
        IOrderDayService orderDayService,
        IPushBroadcaster pushBroadcaster,
        IOptions<PickupWheelOptions> options
    )
    {
        this.database = database;
        this.clock = clock;
        this.orderDayService = orderDayService;
        this.pushBroadcaster = pushBroadcaster;
        this.options = options.Value;
    }

    public async Task<bool> SpinIfDueAsync(CancellationToken ct)
    {
        if (!clock.HasLocalTimePassed(options.DeadlineLocalTime))
            return false;

        var today = clock.Today();
        var day = await database.OrderDays.FirstOrDefaultAsync(
            d =>
                d.Date == today
                && d.Status == OrderDayStatus.Open
                && d.CollectorUserId == null
                && d.OrderingClosedAt == null,
            ct
        );
        if (day is null || await HasSpunAsync(day.Id, ct))
            return false;

        var dayOrders = await LoadDayOrdersAsync(day.Id, ct);
        if (dayOrders.Count == 0)
            return false;

        var pool = PickupWheelDraw.EligibleFor(
            dayOrders.Select(ToParticipant).ToList(),
            new HashSet<Guid>()
        );
        var chosenId = PickupWheelDraw.Pick(pool, Random.Shared);
        if (!await TrySpinAsync(day, dayOrders, chosenId, round: 1, ct))
            return false;

        var chosenName = await DisplayNameAsync(chosenId, ct);
        var verdicts = PickupWheelTextBuilder.Verdicts;
        var template = verdicts[Random.Shared.Next(verdicts.Count)];
        await pushBroadcaster.BroadcastToEveryoneAsync(
            PickupWheelTextBuilder.Title,
            PickupWheelTextBuilder.BuildVerdict(template, chosenName, day.Synonym),
            ct
        );
        return true;
    }

    public async Task<Result<OrderDayDetails>> ExcuseAsync(
        ExcusePickupWheelCommand command,
        CancellationToken ct
    )
    {
        var day = await database.OrderDays.FirstOrDefaultAsync(d => d.Id == command.OrderDayId, ct);
        if (day is null)
            return Result<OrderDayDetails>.NotFound("Döner-Tag nicht gefunden.");

        if (day.Status != OrderDayStatus.Open || day.OrderingClosedAt is not null)
            return Result<OrderDayDetails>.Conflict("Zu spät, Chef — der Abholer steht fest.");

        var spins = await database
            .PickupWheelSpins.Where(spin => spin.OrderDayId == day.Id)
            .ToListAsync(ct);
        var latest = spins.MaxBy(spin => spin.Round);
        if (latest is null)
            return Result<OrderDayDetails>.Conflict("Das Glücksrad hat heute noch nicht gedreht.");

        var isStillTheChosenCollector =
            latest.ChosenUserId == command.CallerUserId
            && latest.ExcusedAt is null
            && day.CollectorUserId == command.CallerUserId;
        if (!isStillTheChosenCollector)
            return Result<OrderDayDetails>.Forbidden(
                "Nur wen das Rad gewählt hat, darf sich rausreden."
            );

        var dayOrders = await LoadDayOrdersAsync(day.Id, ct);
        var excused = ExcusedIncluding(
            spins.Select(PickupWheelProjector.ToInput).ToList(),
            command.CallerUserId
        );
        var pool = PickupWheelDraw.EligibleFor(dayOrders.Select(ToParticipant).ToList(), excused);
        if (pool.Count == 0)
            return Result<OrderDayDetails>.Conflict(
                "Keiner mehr übrig, Chef — das Rad bleibt bei dir."
            );

        latest.ExcusedAt = clock.UtcNow();
        var chosenId = PickupWheelDraw.Pick(pool, Random.Shared);
        if (!await TrySpinAsync(day, dayOrders, chosenId, latest.Round + 1, ct))
            return Result<OrderDayDetails>.Conflict("Das Rad dreht sich schon, Chef.");

        var excusedName = await DisplayNameAsync(command.CallerUserId, ct);
        var chosenName = await DisplayNameAsync(chosenId, ct);
        await pushBroadcaster.BroadcastToEveryoneAsync(
            PickupWheelTextBuilder.Title,
            PickupWheelTextBuilder.BuildRespin(excusedName, chosenName),
            ct
        );

        return await orderDayService.GetByIdAsync(
            new GetOrderDayQuery(command.CallerUserId, command.OrderDayId),
            ct
        );
    }

    internal static IReadOnlySet<Guid> ExcusedIncluding(
        IReadOnlyCollection<WheelSpinInput> spins,
        Guid excusingUserId
    )
    {
        var excused = spins
            .Where(spin => spin.IsExcused)
            .Select(spin => spin.ChosenUserId)
            .ToHashSet();
        excused.Add(excusingUserId);
        return excused;
    }

    // Makes the chosen person the day's sole pickup + collector and records the spin, all in one
    // save. Returns false when a concurrent spin already took this round (unique index).
    private async Task<bool> TrySpinAsync(
        OrderDay day,
        IReadOnlyCollection<Order> dayOrders,
        Guid chosenId,
        int round,
        CancellationToken ct
    )
    {
        var now = clock.UtcNow();
        await SinglePickupDesignator.DesignateAsync(database, dayOrders, chosenId, now, ct);
        day.CollectorUserId = chosenId;
        database.PickupWheelSpins.Add(
            new PickupWheelSpin
            {
                Id = Guid.NewGuid(),
                OrderDayId = day.Id,
                Round = round,
                ChosenUserId = chosenId,
                SpunAt = now,
            }
        );

        try
        {
            await database.SaveChangesAsync(ct);
            return true;
        }
        catch (DbUpdateException)
        {
            database.ChangeTracker.Clear();
            return false;
        }
    }

    private Task<bool> HasSpunAsync(Guid orderDayId, CancellationToken ct) =>
        database.PickupWheelSpins.AnyAsync(spin => spin.OrderDayId == orderDayId, ct);

    private async Task<IReadOnlyList<Order>> LoadDayOrdersAsync(
        Guid orderDayId,
        CancellationToken ct
    ) => await database.Orders.Where(order => order.OrderDayId == orderDayId).ToListAsync(ct);

    private async Task<string> DisplayNameAsync(Guid userId, CancellationToken ct) =>
        await database
            .Users.AsNoTracking()
            .Where(user => user.Id == userId)
            .Select(user => user.DisplayName)
            .FirstOrDefaultAsync(ct)
        ?? string.Empty;

    private static WheelParticipant ToParticipant(Order order) =>
        PickupWheelProjector.ToParticipant(order);
}
