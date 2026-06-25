using Schulz.DoenerControl.Core.Enums;

namespace Schulz.DoenerControl.Application.Orders;

// Idempotent upsert of the caller's order for a day (add OR edit), allowed only while the day is
// open and before its cutoff. The order is multi-line: UpsertMineAsync REPLACES the order's whole
// line set with these lines. Each line's Kind is resolved from its menu item at write time; pizza
// lines force Meat=null/Sauces=None in the service regardless of what the request carried.
public sealed record UpsertOrderCommand(
    Guid CallerUserId,
    Guid OrderDayId,
    IReadOnlyList<UpsertOrderLineCommand> Lines,
    bool IsPickup
);

// PizzaVariantId is the catalog variant id a pizza line carries; it is validated against the
// available PizzaVariants catalog at write time (an unknown id rejects the upsert). Null for döner.
public sealed record UpsertOrderLineCommand(
    string ProductId,
    MeatType? Meat,
    Guid? PizzaVariantId,
    Sauce Sauces,
    int PriceCents,
    string? Extra,
    int Quantity
);
