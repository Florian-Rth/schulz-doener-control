using Microsoft.EntityFrameworkCore;
using Schulz.DoenerControl.Application.Calculators;
using Schulz.DoenerControl.Application.Notifications;
using Schulz.DoenerControl.Application.OrderDays;
using Schulz.DoenerControl.Application.Push;
using Schulz.DoenerControl.Core;
using Schulz.DoenerControl.Core.Entities;
using Schulz.DoenerControl.Core.Enums;
using Schulz.DoenerControl.Infrastructure.Debts;
using Schulz.DoenerControl.Infrastructure.Persistence;

namespace Schulz.DoenerControl.Infrastructure.OrderDays;

public sealed class OrderDayService : IOrderDayService
{
    private const string NotificationTitle = "Döner-Tag";

    private readonly AppDbContext database;
    private readonly OrderDayClock clock;
    private readonly INotificationBroadcaster broadcaster;
    private readonly IPushBroadcaster pushBroadcaster;
    private readonly CloseDayDebtGenerator debtGenerator;

    public OrderDayService(
        AppDbContext database,
        OrderDayClock clock,
        INotificationBroadcaster broadcaster,
        IPushBroadcaster pushBroadcaster,
        CloseDayDebtGenerator debtGenerator
    )
    {
        this.database = database;
        this.clock = clock;
        this.broadcaster = broadcaster;
        this.pushBroadcaster = pushBroadcaster;
        this.debtGenerator = debtGenerator;
    }

    public async Task<Result<OrderDayDetails?>> GetTodayAsync(Guid callerId, CancellationToken ct)
    {
        var today = clock.Today();
        var day = await LoadDay(d => d.Date == today, ct);
        if (day is null)
            return Result<OrderDayDetails?>.Success(null);

        return Result<OrderDayDetails?>.Success(await ProjectAsync(day, callerId, ct));
    }

    public async Task<Result<OpenDayResult>> OpenTodayAsync(
        OpenDayCommand command,
        CancellationToken ct
    )
    {
        var today = clock.Today();

        var existing = await LoadDay(d => d.Date == today, ct);
        if (existing is not null)
        {
            // Idempotent: a day already exists for today → return it, notify nobody again.
            return Result<OpenDayResult>.Success(
                new OpenDayResult(await ProjectAsync(existing, command.CallerUserId, ct), 0)
            );
        }

        var now = clock.UtcNow();
        var synonym = PickSynonym();
        var day = new OrderDay
        {
            Id = Guid.NewGuid(),
            Date = today,
            Status = OrderDayStatus.Open,
            Synonym = synonym,
            OrderCutoffAt = clock.CutoffFor(today),
            OpenedByUserId = command.CallerUserId,
            OpenedAt = now,
            ClosedAt = null,
            CollectorUserId = null,
        };
        database.OrderDays.Add(day);

        var pushBody = PushTextBuilder.BuildOpenDayBody(synonym);
        var notifiedCount = await broadcaster.BroadcastDayOpenedAsync(
            day.Id,
            NotificationTitle,
            pushBody,
            command.CallerUserId,
            ct
        );

        try
        {
            await database.SaveChangesAsync(ct);
        }
        catch (DbUpdateException)
        {
            // Lost the simultaneous-open race on the unique Date index → re-read and return the
            // winner's day instead of erroring. No push fires for a day we did not open.
            database.ChangeTracker.Clear();
            var winner = await LoadDay(d => d.Date == today, ct);
            if (winner is null)
                throw;

            return Result<OpenDayResult>.Success(
                new OpenDayResult(await ProjectAsync(winner, command.CallerUserId, ct), 0)
            );
        }

        // Fire the real Web Push only after the open is committed, so a day that lost the race never
        // pushes. Mirrors the in-app feed broadcast: every OTHER active subscriber, the synonym body.
        await pushBroadcaster.BroadcastDayOpenedAsync(
            NotificationTitle,
            pushBody,
            command.CallerUserId,
            ct
        );

        var reloaded = await LoadDay(d => d.Id == day.Id, ct);
        return Result<OpenDayResult>.Success(
            new OpenDayResult(
                await ProjectAsync(reloaded!, command.CallerUserId, ct),
                notifiedCount
            )
        );
    }

    public async Task<Result<CloseDayResult>> CloseAsync(
        CloseDayCommand command,
        CancellationToken ct
    )
    {
        var day = await database.OrderDays.FirstOrDefaultAsync(d => d.Id == command.OrderDayId, ct);
        if (day is null)
            return Result<CloseDayResult>.NotFound("Döner-Tag nicht gefunden.");

        if (day.Status == OrderDayStatus.Closed)
            return Result<CloseDayResult>.Conflict("Der Döner-Tag ist bereits geschlossen.");

        var now = clock.UtcNow();
        day.Status = OrderDayStatus.Closed;
        day.ClosedAt = now;

        // On close, crystallize the day's debts: one Debt per non-pickup payer → the collector for
        // their own order price. Persisted in the same SaveChanges as the close transition.
        var debtsCreated = await debtGenerator.GenerateForCloseAsync(day, now, ct);

        await database.SaveChangesAsync(ct);

        var reloaded = await LoadDay(d => d.Id == day.Id, ct);
        return Result<CloseDayResult>.Success(
            new CloseDayResult(
                await ProjectAsync(reloaded!, command.CallerUserId, ct),
                debtsCreated
            )
        );
    }

    public async Task<Result<OrderDayDetails>> CloseOrderingAsync(
        CloseOrderingCommand command,
        CancellationToken ct
    )
    {
        var day = await database.OrderDays.FirstOrDefaultAsync(d => d.Id == command.OrderDayId, ct);
        if (day is null)
            return Result<OrderDayDetails>.NotFound("Döner-Tag nicht gefunden.");

        // Only the designated collector may lock ordering. No collector means nobody may — the
        // "one designated payer" model. This is a deliberately stricter rule than close-day.
        if (day.CollectorUserId != command.CallerUserId)
            return Result<OrderDayDetails>.Forbidden(
                "Nur der Abholer darf die Bestellung schließen."
            );

        if (day.Status == OrderDayStatus.Closed)
            return Result<OrderDayDetails>.Conflict("Der Döner-Tag ist bereits geschlossen.");

        if (day.OrderingClosedAt is not null)
            return Result<OrderDayDetails>.Conflict("Die Bestellung ist bereits geschlossen.");

        day.OrderingClosedAt = clock.UtcNow();
        await database.SaveChangesAsync(ct);

        var reloaded = await LoadDay(d => d.Id == day.Id, ct);
        return Result<OrderDayDetails>.Success(
            await ProjectAsync(reloaded!, command.CallerUserId, ct)
        );
    }

    public async Task<Result<OrderDayDetails>> GetByIdAsync(
        GetOrderDayQuery query,
        CancellationToken ct
    )
    {
        var day = await LoadDay(d => d.Id == query.OrderDayId, ct);
        if (day is null)
            return Result<OrderDayDetails>.NotFound("Döner-Tag nicht gefunden.");

        return Result<OrderDayDetails>.Success(await ProjectAsync(day, query.CallerUserId, ct));
    }

    private async Task<OrderDay?> LoadDay(
        System.Linq.Expressions.Expression<Func<OrderDay, bool>> predicate,
        CancellationToken ct
    ) =>
        await database
            .OrderDays.AsNoTracking()
            .Include(d => d.Orders!)
                .ThenInclude(order => order.User)
            .Include(d => d.Orders!)
                .ThenInclude(order => order.Lines)
            .FirstOrDefaultAsync(predicate, ct);

    private async Task<OrderDayDetails> ProjectAsync(
        OrderDay day,
        Guid callerId,
        CancellationToken ct
    )
    {
        var orders = (day.Orders ?? new List<Order>()).OrderBy(order => order.CreatedAt).ToList();

        var productNames = await LoadProductNames(orders, ct);

        var rows = orders.Select(order => MapRow(order, callerId, productNames)).ToList();
        var pickupNames = orders
            .Where(order => order.IsPickup)
            .Select(order => order.User?.DisplayName ?? string.Empty)
            .ToList();

        var now = clock.UtcNow();
        var isPastCutoff = now > day.OrderCutoffAt;
        var myOrder = orders.FirstOrDefault(order => order.UserId == callerId);
        var cutoffLabel = clock.CutoffLabel();
        var canStillOrder = OrderWindow.CanOrder(
            day.Status,
            day.OrderingClosedAt,
            day.OrderCutoffAt,
            now
        );

        return new OrderDayDetails(
            day.Id,
            day.Date,
            day.Status.ToString(),
            day.Synonym,
            PushTextBuilder.BuildOpenDayPreview(day.Synonym, cutoffLabel),
            day.OrderCutoffAt,
            cutoffLabel,
            isPastCutoff,
            orders.Count,
            pickupNames,
            rows,
            canStillOrder,
            day.OrderingClosedAt is not null,
            myOrder?.Id
        );
    }

    private async Task<IReadOnlyDictionary<string, string>> LoadProductNames(
        IReadOnlyCollection<Order> orders,
        CancellationToken ct
    )
    {
        if (orders.Count == 0)
            return new Dictionary<string, string>();

        var productIds = orders
            .SelectMany(order => order.Lines)
            .Select(line => line.ProductId)
            .Distinct()
            .ToList();
        return await database
            .MenuItems.AsNoTracking()
            .Where(item => productIds.Contains(item.Id))
            .ToDictionaryAsync(item => item.Id, item => item.Name, ct);
    }

    private static OrderRowSummary MapRow(
        Order order,
        Guid callerId,
        IReadOnlyDictionary<string, string> productNames
    )
    {
        var displayName = order.User?.DisplayName ?? string.Empty;
        // Single-item contract (B7): each order has exactly one line; the row mirrors it and the
        // price is the order total (sum of Quantity * per-unit price over the lines).
        var line = order.Lines.Single();
        var productName = productNames.GetValueOrDefault(line.ProductId, line.ProductId);
        return new OrderRowSummary(
            order.Id,
            displayName,
            NameFormatter.InitialsOf(displayName),
            order.User?.AvatarColorHex ?? string.Empty,
            OrderLabelBuilder.BuildProductLabel(
                line.Kind,
                productName,
                line.Meat,
                line.PizzaVariant
            ),
            OrderLabelBuilder.BuildDescription(line.Kind, line.Sauces, line.Extra),
            order.TotalCents,
            MoneyFormatter.ToGermanString(order.TotalCents),
            order.UserId == callerId,
            order.IsPickup
        );
    }

    private static string PickSynonym()
    {
        var synonyms = PushTextBuilder.Synonyms;
        var index = Random.Shared.Next(synonyms.Count);
        return synonyms[index];
    }
}
