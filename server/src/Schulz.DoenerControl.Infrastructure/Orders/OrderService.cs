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

        if (!OrderWindow.CanOrder(day.Status, day.OrderingClosedAt))
            return Result<OrderDetails>.Conflict(CutoffMessage);

        var menuItems = await LoadMenuItems(command.Lines, ct);
        if (menuItems is null)
            return Result<OrderDetails>.NotFound("Produkt nicht gefunden.");

        // Pizza lines carry a catalog variant id; validate every referenced id against the available
        // PizzaVariants catalog (an unknown / retired id rejects the whole upsert).
        var pizzaVariantNames = await LoadPizzaVariantNames(command.Lines, ct);
        if (pizzaVariantNames is null)
            return Result<OrderDetails>.NotFound("Pizza-Sorte nicht gefunden.");

        var now = clock.UtcNow();
        var existing = await database.Orders.FirstOrDefaultAsync(
            order => order.OrderDayId == command.OrderDayId && order.UserId == command.CallerUserId,
            ct
        );

        if (existing is null)
        {
            existing = new Order
            {
                Id = Guid.NewGuid(),
                OrderDayId = command.OrderDayId,
                UserId = command.CallerUserId,
                // When claiming pickup the flag starts OFF; the designator turns it on AFTER it has
                // demoted every other row (SQLite checks the filtered unique index per statement, so a
                // momentary two-pickup state would trip it).
                IsPickup = false,
                OccurredOn = day.OpenedAt,
                CreatedAt = now,
                UpdatedAt = now,
            };
            database.Orders.Add(existing);
        }
        else
        {
            // Same staging as the insert path: never flip the caller ON before the others are cleared.
            existing.IsPickup = command.IsPickup ? existing.IsPickup : false;
            existing.UpdatedAt = now;

            // Multi-line contract: the upsert REPLACES the order's whole line set. Delete the old
            // lines through the DbSet (the FK is required + cascade, so a navigation delete + re-add
            // in one SaveChanges trips DbUpdateConcurrencyException) and persist before adding fresh.
            var oldLines = await database
                .OrderLines.Where(line => line.OrderId == existing.Id)
                .ToListAsync(ct);
            database.OrderLines.RemoveRange(oldLines);
            await database.SaveChangesAsync(ct);
        }

        // Single-pickup invariant: when the caller toggles pickup on, they become the sole pickup —
        // every other order of the day is demoted FIRST, then the caller is flipped on (see the
        // designator's two-phase persist). Releasing leaves the others untouched.
        if (command.IsPickup)
        {
            var dayOrders = await LoadDayOrdersForPickup(command.OrderDayId, existing, ct);
            await SinglePickupDesignator.DesignateAsync(
                database,
                dayOrders,
                command.CallerUserId,
                now,
                ct
            );
        }

        // Auto-designate: the order-form pickup toggle reconciles the day's single collector (the
        // frontend never calls SetCollector). `day` is tracked, so this persists on the SaveChanges below.
        day.CollectorUserId = CollectorDesignation.Reconcile(
            day.CollectorUserId,
            command.CallerUserId,
            command.IsPickup
        );

        var newLines = BuildLines(command.Lines, menuItems, existing.Id).ToList();
        database.OrderLines.AddRange(newLines);
        await database.SaveChangesAsync(ct);

        existing.Lines = newLines;
        var productNames = ProductNamesFrom(menuItems);
        return Result<OrderDetails>.Success(
            OrderDetailsFactory.Build(existing, productNames, pizzaVariantNames)
        );
    }

    // Loads every OTHER tracked order of the day and appends the caller's own order so the designator
    // sees the full set. The caller's order may be brand-new (Add'd, not yet saved), so it can't be
    // pulled from the DB query — it's spliced in explicitly.
    private async Task<IReadOnlyList<Order>> LoadDayOrdersForPickup(
        Guid orderDayId,
        Order own,
        CancellationToken ct
    )
    {
        var others = await database
            .Orders.Where(order => order.OrderDayId == orderDayId && order.Id != own.Id)
            .ToListAsync(ct);
        others.Add(own);
        return others;
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

        var productNames = await ResolveProductNames(order, ct);
        var pizzaVariantNames = await ResolvePizzaVariantNames(order, ct);
        return Result<OrderDetails?>.Success(
            OrderDetailsFactory.Build(order, productNames, pizzaVariantNames)
        );
    }

    public async Task<Result> DeleteMineAsync(DeleteOrderCommand command, CancellationToken ct)
    {
        var day = await database.OrderDays.FirstOrDefaultAsync(d => d.Id == command.OrderDayId, ct);
        if (day is null)
            return Result.NotFound("Döner-Tag nicht gefunden.");

        if (!OrderWindow.CanOrder(day.Status, day.OrderingClosedAt))
            return Result.Conflict(CutoffMessage);

        var order = await database.Orders.FirstOrDefaultAsync(
            o => o.OrderDayId == command.OrderDayId && o.UserId == command.CallerUserId,
            ct
        );
        if (order is null)
            return Result.NotFound("Keine Bestellung gefunden.");

        // Withdrawing leaves the day entirely (no pickup), so reconcile the single Abholer: if the
        // leaver was the designated collector, vacate it — otherwise debt generation at close would
        // credit a non-participant. `day` is tracked, so this persists on the SaveChanges below.
        day.CollectorUserId = CollectorDesignation.Reconcile(
            day.CollectorUserId,
            command.CallerUserId,
            isPickup: false
        );

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

        var productNames = await ResolveProductNames(order, ct);
        var pizzaVariantNames = await ResolvePizzaVariantNames(order, ct);
        var lines = order
            .Lines.OrderBy(line => line.ProductId)
            .ThenBy(line => line.Id)
            .Select(line => BuildResultLine(line, productNames, pizzaVariantNames))
            .ToList();
        var orderTotal = order.TotalCents;

        var collector = await ResolveCollector(day, ct);
        var abholer = collector is null ? null : BuildAbholer(collector);

        // No pay link on the success screen: a non-pickup payer only reimburses the Abholer later, on
        // the home screen, once ordering is closed and the orders are frozen (avoids paying before the
        // order set — and thus the amount — is final).

        // When the caller is the designated collector, sum what the non-pickup colleagues owe them.
        var (collectCents, collectCount) = await ResolveCollectTotals(day, order, collector, ct);

        return Result<OrderResultDetails>.Success(
            new OrderResultDetails(
                lines,
                orderTotal,
                order.IsPickup,
                abholer,
                collectCents,
                collectCount
            )
        );
    }

    private static OrderResultLineDetails BuildResultLine(
        OrderLine line,
        IReadOnlyDictionary<string, string> productNames,
        IReadOnlyDictionary<Guid, string> pizzaVariantNames
    )
    {
        var productName = productNames.GetValueOrDefault(line.ProductId, line.ProductId);
        var variantName = line.PizzaVariantId is { } id
            ? pizzaVariantNames.GetValueOrDefault(id)
            : null;
        return new OrderResultLineDetails(
            OrderLabelBuilder.BuildProductLabel(line.Kind, productName, line.Meat, variantName),
            OrderLabelBuilder.BuildDescription(line.Kind, line.Sauces, line.Extra),
            line.Quantity,
            line.PriceCents,
            line.Quantity * line.PriceCents
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
            // Display field: surface the collector's reconstructed base link, never the bare handle.
            PayPalLinkBuilder.BuildLink(collector.PayPalHandle, null)
        );

    // Loads the menu items for every distinct product the command references; returns null when any
    // referenced product is unknown. Keyed by id so each line resolves its own kind and name.
    private async Task<IReadOnlyDictionary<string, MenuItem>?> LoadMenuItems(
        IReadOnlyList<UpsertOrderLineCommand> lines,
        CancellationToken ct
    )
    {
        var productIds = lines.Select(line => line.ProductId).Distinct().ToList();
        var items = await database
            .MenuItems.Where(item => productIds.Contains(item.Id))
            .ToDictionaryAsync(item => item.Id, ct);

        return productIds.All(items.ContainsKey) ? items : null;
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

    // Resolves the catalog Name for every pizza-variant id the command references, but only among the
    // AVAILABLE variants. Returns null when any referenced id is unknown / retired, so the caller can
    // reject the upsert (the parser only shapes the id string; the catalog is authoritative here).
    private async Task<IReadOnlyDictionary<Guid, string>?> LoadPizzaVariantNames(
        IReadOnlyList<UpsertOrderLineCommand> lines,
        CancellationToken ct
    )
    {
        var variantIds = lines
            .Where(line => line.PizzaVariantId is not null)
            .Select(line => line.PizzaVariantId!.Value)
            .Distinct()
            .ToList();
        if (variantIds.Count == 0)
            return new Dictionary<Guid, string>();

        var names = await database
            .PizzaVariants.AsNoTracking()
            .Where(variant => variant.IsAvailable && variantIds.Contains(variant.Id))
            .ToDictionaryAsync(variant => variant.Id, variant => variant.Name, ct);

        return variantIds.All(names.ContainsKey) ? names : null;
    }

    // Resolves the catalog Name for an already-persisted order's pizza-variant ids (read path). Unlike
    // the write path this includes retired variants, so a past order whose variant was later retired
    // still renders its label.
    private async Task<IReadOnlyDictionary<Guid, string>> ResolvePizzaVariantNames(
        Order order,
        CancellationToken ct
    )
    {
        var variantIds = order
            .Lines.Where(line => line.PizzaVariantId is not null)
            .Select(line => line.PizzaVariantId!.Value)
            .Distinct()
            .ToList();
        if (variantIds.Count == 0)
            return new Dictionary<Guid, string>();

        return await database
            .PizzaVariants.AsNoTracking()
            .Where(variant => variantIds.Contains(variant.Id))
            .ToDictionaryAsync(variant => variant.Id, variant => variant.Name, ct);
    }

    private static IReadOnlyDictionary<string, string> ProductNamesFrom(
        IReadOnlyDictionary<string, MenuItem> menuItems
    ) => menuItems.ToDictionary(pair => pair.Key, pair => pair.Value.Name);

    private static IEnumerable<OrderLine> BuildLines(
        IReadOnlyList<UpsertOrderLineCommand> lines,
        IReadOnlyDictionary<string, MenuItem> menuItems,
        Guid orderId
    ) => lines.Select(line => BuildLine(line, menuItems[line.ProductId].Kind, orderId));

    private static (MeatType? Meat, Guid? PizzaVariantId, Sauce Sauces) NormalizeForKind(
        ProductKind kind,
        MeatType? meat,
        Guid? pizzaVariantId,
        Sauce sauces
    ) => kind == ProductKind.Pizza ? (null, pizzaVariantId, Sauce.None) : (meat, null, sauces);

    private static OrderLine BuildLine(
        UpsertOrderLineCommand command,
        ProductKind kind,
        Guid orderId
    )
    {
        var (meat, pizzaVariantId, sauces) = NormalizeForKind(
            kind,
            command.Meat,
            command.PizzaVariantId,
            command.Sauces
        );
        return new OrderLine
        {
            Id = Guid.NewGuid(),
            OrderId = orderId,
            ProductId = command.ProductId,
            Kind = kind,
            Meat = meat,
            PizzaVariantId = pizzaVariantId,
            Sauces = sauces,
            PriceCents = command.PriceCents,
            Extra = command.Extra,
            Quantity = command.Quantity,
        };
    }
}
