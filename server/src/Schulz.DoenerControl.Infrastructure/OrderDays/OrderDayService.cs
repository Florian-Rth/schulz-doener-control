using Microsoft.EntityFrameworkCore;
using Schulz.DoenerControl.Application.Calculators;
using Schulz.DoenerControl.Application.Notifications;
using Schulz.DoenerControl.Application.OrderDays;
using Schulz.DoenerControl.Core;
using Schulz.DoenerControl.Core.Entities;
using Schulz.DoenerControl.Core.Enums;
using Schulz.DoenerControl.Infrastructure.Persistence;

namespace Schulz.DoenerControl.Infrastructure.OrderDays;

public sealed class OrderDayService : IOrderDayService
{
    private const string NotificationTitle = "Döner-Tag";

    private readonly AppDbContext database;
    private readonly OrderDayClock clock;
    private readonly INotificationBroadcaster broadcaster;

    public OrderDayService(
        AppDbContext database,
        OrderDayClock clock,
        INotificationBroadcaster broadcaster
    )
    {
        this.database = database;
        this.clock = clock;
        this.broadcaster = broadcaster;
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

        var notifiedCount = await broadcaster.BroadcastDayOpenedAsync(
            day.Id,
            NotificationTitle,
            PushTextBuilder.BuildOpenDayBody(synonym),
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
            // winner's day instead of erroring.
            database.ChangeTracker.Clear();
            var winner = await LoadDay(d => d.Date == today, ct);
            if (winner is null)
                throw;

            return Result<OpenDayResult>.Success(
                new OpenDayResult(await ProjectAsync(winner, command.CallerUserId, ct), 0)
            );
        }

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

        day.Status = OrderDayStatus.Closed;
        day.ClosedAt = clock.UtcNow();

        // Extension point for the debt-generation feature: on close, one Debt per non-pickup payer
        // → the collector. Until that lands, closing crystallizes no debts.
        var debtsCreated = 0;

        await database.SaveChangesAsync(ct);

        var reloaded = await LoadDay(d => d.Id == day.Id, ct);
        return Result<CloseDayResult>.Success(
            new CloseDayResult(
                await ProjectAsync(reloaded!, command.CallerUserId, ct),
                debtsCreated
            )
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
        var isOpen = day.Status == OrderDayStatus.Open;
        var myOrder = orders.FirstOrDefault(order => order.UserId == callerId);
        var cutoffLabel = clock.CutoffLabel();

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
            isOpen && !isPastCutoff,
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

        var productIds = orders.Select(order => order.ProductId).Distinct().ToList();
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
        var productName = productNames.GetValueOrDefault(order.ProductId, order.ProductId);
        return new OrderRowSummary(
            order.Id,
            displayName,
            NameFormatter.InitialsOf(displayName),
            order.User?.AvatarColorHex ?? string.Empty,
            OrderLabelBuilder.BuildProductLabel(
                order.Kind,
                productName,
                order.Meat,
                order.PizzaVariant
            ),
            OrderLabelBuilder.BuildDescription(order.Kind, order.Sauces, order.Extra),
            order.PriceCents,
            MoneyFormatter.ToGermanString(order.PriceCents),
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
