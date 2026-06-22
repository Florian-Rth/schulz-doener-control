using Microsoft.EntityFrameworkCore;
using Schulz.DoenerControl.Application.Calculators;
using Schulz.DoenerControl.Application.OrderDays;
using Schulz.DoenerControl.Application.Orders;
using Schulz.DoenerControl.Core;
using Schulz.DoenerControl.Core.Entities;
using Schulz.DoenerControl.Core.Enums;
using Schulz.DoenerControl.Infrastructure.OrderDays;
using Schulz.DoenerControl.Infrastructure.Persistence;

namespace Schulz.DoenerControl.Infrastructure.Orders;

public sealed class PickupService : IPickupService
{
    private const string CutoffMessage = "Bestellschluss vorbei.";

    private readonly AppDbContext database;
    private readonly OrderDayClock clock;
    private readonly IOrderDayService orderDayService;

    public PickupService(
        AppDbContext database,
        OrderDayClock clock,
        IOrderDayService orderDayService
    )
    {
        this.database = database;
        this.clock = clock;
        this.orderDayService = orderDayService;
    }

    public Task<Result<PickupResult>> ClaimAsync(
        ClaimPickupCommand command,
        CancellationToken ct
    ) => SetPickupAsync(command.CallerUserId, command.OrderDayId, isPickup: true, ct);

    public Task<Result<PickupResult>> ReleaseAsync(
        ReleasePickupCommand command,
        CancellationToken ct
    ) => SetPickupAsync(command.CallerUserId, command.OrderDayId, isPickup: false, ct);

    public async Task<Result<OrderDayDetails>> SetCollectorAsync(
        SetCollectorCommand command,
        CancellationToken ct
    )
    {
        var day = await database.OrderDays.FirstOrDefaultAsync(d => d.Id == command.OrderDayId, ct);
        if (day is null)
            return Result<OrderDayDetails>.NotFound("Döner-Tag nicht gefunden.");

        if (day.Status != OrderDayStatus.Open)
            return Result<OrderDayDetails>.Conflict("Der Döner-Tag ist geschlossen.");

        var collectorOrder = await database.Orders.FirstOrDefaultAsync(
            order =>
                order.OrderDayId == command.OrderDayId && order.UserId == command.CollectorUserId,
            ct
        );
        if (collectorOrder is null || !collectorOrder.IsPickup)
        {
            return Result<OrderDayDetails>.Validation(
                "Der Abholer muss zuerst die Abholung übernehmen."
            );
        }

        day.CollectorUserId = command.CollectorUserId;
        await database.SaveChangesAsync(ct);

        return await orderDayService.GetByIdAsync(
            new GetOrderDayQuery(command.CallerUserId, command.OrderDayId),
            ct
        );
    }

    public async Task<Result<OrderDayDetails>> ClaimCollectorAsync(
        ClaimCollectorCommand command,
        CancellationToken ct
    )
    {
        var day = await database.OrderDays.FirstOrDefaultAsync(d => d.Id == command.OrderDayId, ct);
        if (day is null)
            return Result<OrderDayDetails>.NotFound("Döner-Tag nicht gefunden.");

        if (day.Status != OrderDayStatus.Open)
            return Result<OrderDayDetails>.Conflict("Der Döner-Tag ist geschlossen.");

        var callerOrder = await database.Orders.FirstOrDefaultAsync(
            order => order.OrderDayId == command.OrderDayId && order.UserId == command.CallerUserId,
            ct
        );
        if (callerOrder is null)
            return Result<OrderDayDetails>.Validation("Erst bestellen, dann abholen, Chef.");

        // Take-over path: clear the previous collector's pickup flag so they become a regular debtor
        // again. Without this they keep IsPickup=true and slip out of the close-day debtor set (a free
        // Döner) and double-up the open-day "Abholer heute:" list.
        if (
            day.CollectorUserId is { } previousCollectorId
            && previousCollectorId != command.CallerUserId
        )
        {
            var previousCollectorOrder = await database.Orders.FirstOrDefaultAsync(
                order =>
                    order.OrderDayId == command.OrderDayId && order.UserId == previousCollectorId,
                ct
            );
            if (previousCollectorOrder is not null)
            {
                previousCollectorOrder.IsPickup = false;
                previousCollectorOrder.UpdatedAt = clock.UtcNow();
            }
        }

        // Force both the pickup flag and the collector to the caller. Unconditional: this is also the
        // take-over path, so it must override whoever is currently designated.
        callerOrder.IsPickup = true;
        callerOrder.UpdatedAt = clock.UtcNow();
        day.CollectorUserId = command.CallerUserId;
        await database.SaveChangesAsync(ct);

        return await orderDayService.GetByIdAsync(
            new GetOrderDayQuery(command.CallerUserId, command.OrderDayId),
            ct
        );
    }

    private async Task<Result<PickupResult>> SetPickupAsync(
        Guid callerUserId,
        Guid orderDayId,
        bool isPickup,
        CancellationToken ct
    )
    {
        var day = await database.OrderDays.FirstOrDefaultAsync(d => d.Id == orderDayId, ct);
        if (day is null)
            return Result<PickupResult>.NotFound("Döner-Tag nicht gefunden.");

        if (!OrderWindow.CanOrder(day.Status, day.OrderingClosedAt))
            return Result<PickupResult>.Conflict(CutoffMessage);

        var order = await database
            .Orders.Include(o => o.Lines)
            .FirstOrDefaultAsync(o => o.OrderDayId == orderDayId && o.UserId == callerUserId, ct);
        if (order is null)
            return Result<PickupResult>.Validation("Erst bestellen, dann abholen.");

        order.IsPickup = isPickup;
        order.UpdatedAt = clock.UtcNow();

        // Auto-designate: a pickup with no collector becomes it; releasing vacates only if self was it.
        day.CollectorUserId = CollectorDesignation.Reconcile(
            day.CollectorUserId,
            callerUserId,
            isPickup
        );

        await database.SaveChangesAsync(ct);

        var productNames = await ResolveProductNames(order, ct);
        var pickupNames = await ResolvePickupNames(orderDayId, ct);

        return Result<PickupResult>.Success(
            new PickupResult(OrderDetailsFactory.Build(order, productNames), pickupNames)
        );
    }

    private async Task<IReadOnlyList<string>> ResolvePickupNames(
        Guid orderDayId,
        CancellationToken ct
    )
    {
        // SQLite cannot ORDER BY a DateTimeOffset, so fetch the pickup orders then sort in memory by
        // creation order (mirrors how the OrderDay projection orders its rows).
        var pickups = await database
            .Orders.AsNoTracking()
            .Where(order => order.OrderDayId == orderDayId && order.IsPickup)
            .Select(order => new { order.CreatedAt, Name = order.User!.DisplayName })
            .ToListAsync(ct);

        return pickups.OrderBy(pickup => pickup.CreatedAt).Select(pickup => pickup.Name).ToList();
    }

    private async Task<IReadOnlyDictionary<string, string>> ResolveProductNames(
        Order order,
        CancellationToken ct
    )
    {
        var productIds = order.Lines.Select(line => line.ProductId).Distinct().ToList();
        if (productIds.Count == 0)
            return new Dictionary<string, string>();

        return await database
            .MenuItems.AsNoTracking()
            .Where(item => productIds.Contains(item.Id))
            .ToDictionaryAsync(item => item.Id, item => item.Name, ct);
    }
}
