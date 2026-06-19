using Microsoft.EntityFrameworkCore;
using Schulz.DoenerControl.Application.Calculators;
using Schulz.DoenerControl.Application.Orders;
using Schulz.DoenerControl.Core;
using Schulz.DoenerControl.Core.Entities;
using Schulz.DoenerControl.Core.Enums;
using Schulz.DoenerControl.Infrastructure.OrderDays;
using Schulz.DoenerControl.Infrastructure.Persistence;

namespace Schulz.DoenerControl.Infrastructure.Orders;

public sealed class OrderService : IOrderService
{
    private const string CutoffMessage = "Bestellschluss vorbei.";

    private readonly AppDbContext database;
    private readonly OrderDayClock clock;

    public OrderService(AppDbContext database, OrderDayClock clock)
    {
        this.database = database;
        this.clock = clock;
    }

    public async Task<Result<OrderDetails>> UpsertMineAsync(
        UpsertOrderCommand command,
        CancellationToken ct
    )
    {
        var day = await database.OrderDays.FirstOrDefaultAsync(d => d.Id == command.OrderDayId, ct);
        if (day is null)
            return Result<OrderDetails>.NotFound("Döner-Tag nicht gefunden.");

        if (!OrderWindow.CanOrder(day.Status, day.OrderCutoffAt, clock.UtcNow()))
            return Result<OrderDetails>.Conflict(CutoffMessage);

        var menuItem = await database.MenuItems.FirstOrDefaultAsync(
            item => item.Id == command.ProductId,
            ct
        );
        if (menuItem is null)
            return Result<OrderDetails>.NotFound("Produkt nicht gefunden.");

        var (meat, pizza, sauces) = NormalizeForKind(
            menuItem.Kind,
            command.Meat,
            command.Pizza,
            command.Sauces
        );

        var now = clock.UtcNow();
        var existing = await database
            .Orders.Include(order => order.Lines)
            .FirstOrDefaultAsync(
                order =>
                    order.OrderDayId == command.OrderDayId && order.UserId == command.CallerUserId,
                ct
            );

        if (existing is null)
        {
            existing = new Order
            {
                Id = Guid.NewGuid(),
                OrderDayId = command.OrderDayId,
                UserId = command.CallerUserId,
                IsPickup = command.IsPickup,
                OccurredOn = day.OpenedAt,
                CreatedAt = now,
                UpdatedAt = now,
            };
            // OrderId is left to EF's relationship fixup via the navigation.
            existing.Lines.Add(BuildLine(command, menuItem.Kind, meat, pizza, sauces));
            database.Orders.Add(existing);
        }
        else
        {
            existing.IsPickup = command.IsPickup;
            existing.UpdatedAt = now;

            // Single-item contract: the upsert REPLACES the order's single line with the submitted
            // item. Mutating the existing line in place (rather than delete + insert) keeps its
            // identity stable and avoids a redundant DELETE.
            var line = existing.Lines.Single();
            line.ProductId = command.ProductId;
            line.Kind = menuItem.Kind;
            line.Meat = meat;
            line.PizzaVariant = pizza;
            line.Sauces = sauces;
            line.PriceCents = command.PriceCents;
            line.Extra = command.Extra;
            line.Quantity = 1;
        }

        await database.SaveChangesAsync(ct);

        return Result<OrderDetails>.Success(OrderDetailsFactory.Build(existing, menuItem.Name));
    }

    public async Task<Result<OrderDetails?>> GetMineAsync(
        GetMyOrderQuery query,
        CancellationToken ct
    )
    {
        var order = await database
            .Orders.AsNoTracking()
            .Include(o => o.Lines)
            .FirstOrDefaultAsync(
                o => o.OrderDayId == query.OrderDayId && o.UserId == query.CallerUserId,
                ct
            );
        if (order is null)
            return Result<OrderDetails?>.Success(null);

        var productName = await ResolveProductName(order.Lines.Single().ProductId, ct);
        return Result<OrderDetails?>.Success(OrderDetailsFactory.Build(order, productName));
    }

    public async Task<Result> DeleteMineAsync(DeleteOrderCommand command, CancellationToken ct)
    {
        var day = await database.OrderDays.FirstOrDefaultAsync(d => d.Id == command.OrderDayId, ct);
        if (day is null)
            return Result.NotFound("Döner-Tag nicht gefunden.");

        if (!OrderWindow.CanOrder(day.Status, day.OrderCutoffAt, clock.UtcNow()))
            return Result.Conflict(CutoffMessage);

        var order = await database.Orders.FirstOrDefaultAsync(
            o => o.OrderDayId == command.OrderDayId && o.UserId == command.CallerUserId,
            ct
        );
        if (order is null)
            return Result.NotFound("Keine Bestellung gefunden.");

        database.Orders.Remove(order);
        await database.SaveChangesAsync(ct);
        return Result.Success();
    }

    public async Task<Result<OrderResultDetails>> GetResultAsync(
        GetOrderResultQuery query,
        CancellationToken ct
    )
    {
        var order = await database
            .Orders.AsNoTracking()
            .Include(o => o.Lines)
            .FirstOrDefaultAsync(o => o.Id == query.OrderId, ct);

        // Don't leak other people's orders: an order that isn't the caller's reads as NotFound.
        if (order is null || order.UserId != query.CallerUserId)
            return Result<OrderResultDetails>.NotFound("Bestellung nicht gefunden.");

        var day = await database
            .OrderDays.AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == order.OrderDayId, ct);
        if (day is null)
            return Result<OrderResultDetails>.NotFound("Döner-Tag nicht gefunden.");

        var line = order.Lines.Single();
        var productName = await ResolveProductName(line.ProductId, ct);
        var label = OrderLabelBuilder.BuildProductLabel(
            line.Kind,
            productName,
            line.Meat,
            line.PizzaVariant
        );
        var detail = OrderLabelBuilder.BuildDescription(line.Kind, line.Sauces, line.Extra);
        var orderTotal = order.TotalCents;

        var collector = await ResolveCollector(day, ct);
        var abholer = collector is null ? null : BuildAbholer(collector);

        // The caller's PayPal deep-link to the collector for their own order total — only when the
        // caller is a non-pickup payer and there is a collector with a handle.
        var myPayPalUrl =
            order.IsPickup || collector is null
                ? null
                : PayPalLinkBuilder.BuildLink(collector.PayPalHandle, orderTotal);

        // When the caller is the designated collector, sum what the non-pickup colleagues owe them.
        var (collectCents, collectCount) = await ResolveCollectTotals(day, order, collector, ct);

        return Result<OrderResultDetails>.Success(
            new OrderResultDetails(
                label,
                orderTotal,
                detail,
                order.IsPickup,
                abholer,
                collectCents,
                collectCount,
                myPayPalUrl
            )
        );
    }

    private async Task<(int CollectCents, int CollectCount)> ResolveCollectTotals(
        OrderDay day,
        Order order,
        User? collector,
        CancellationToken ct
    )
    {
        if (collector is null || collector.Id != order.UserId)
            return (0, 0);

        // Each non-pickup order owes its own total (sum of its lines' Quantity * per-unit price).
        var owed = await database
            .Orders.AsNoTracking()
            .Where(o => o.OrderDayId == day.Id && !o.IsPickup)
            .Select(o => o.Lines.Sum(line => line.Quantity * line.PriceCents))
            .ToListAsync(ct);

        return (owed.Sum(), owed.Count);
    }

    private async Task<User?> ResolveCollector(OrderDay day, CancellationToken ct)
    {
        if (day.CollectorUserId is not { } collectorId)
            return null;

        return await database
            .Users.AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == collectorId, ct);
    }

    private static AbholerDetails BuildAbholer(User collector) =>
        new(
            collector.DisplayName,
            NameFormatter.InitialsOf(collector.DisplayName),
            collector.AvatarColorHex,
            collector.PayPalHandle
        );

    private async Task<string> ResolveProductName(string productId, CancellationToken ct)
    {
        var name = await database
            .MenuItems.AsNoTracking()
            .Where(item => item.Id == productId)
            .Select(item => item.Name)
            .FirstOrDefaultAsync(ct);
        return name ?? productId;
    }

    private static (MeatType? Meat, PizzaVariant? Pizza, Sauce Sauces) NormalizeForKind(
        ProductKind kind,
        MeatType? meat,
        PizzaVariant? pizza,
        Sauce sauces
    ) => kind == ProductKind.Pizza ? (null, pizza, Sauce.None) : (meat, null, sauces);

    private static OrderLine BuildLine(
        UpsertOrderCommand command,
        ProductKind kind,
        MeatType? meat,
        PizzaVariant? pizza,
        Sauce sauces
    ) =>
        new()
        {
            Id = Guid.NewGuid(),
            ProductId = command.ProductId,
            Kind = kind,
            Meat = meat,
            PizzaVariant = pizza,
            Sauces = sauces,
            PriceCents = command.PriceCents,
            Extra = command.Extra,
            Quantity = 1,
        };
}
