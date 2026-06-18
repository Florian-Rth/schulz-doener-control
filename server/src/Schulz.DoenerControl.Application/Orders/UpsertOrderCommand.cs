using Schulz.DoenerControl.Core.Enums;

namespace Schulz.DoenerControl.Application.Orders;

// Idempotent upsert of the caller's order for a day (add OR edit), allowed only while the day is
// open and before its cutoff. Kind is resolved from the menu item at write time; pizza orders force
// Meat=null/Sauces=None in the service regardless of what the request carried.
public sealed record UpsertOrderCommand(
    Guid CallerUserId,
    Guid OrderDayId,
    string ProductId,
    MeatType? Meat,
    PizzaVariant? Pizza,
    Sauce Sauces,
    int PriceCents,
    string? Extra,
    bool IsPickup
);
