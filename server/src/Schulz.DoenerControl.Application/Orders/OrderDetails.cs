namespace Schulz.DoenerControl.Application.Orders;

// A single order projection for the order-screen edit flow and the upsert/pickup responses.
// ProductLabel/Detail mirror the mock's productLabel/detail builders; money is exposed both as
// cents and the German label so the UI never reformats it.
public sealed record OrderDetails(
    Guid Id,
    Guid OrderDayId,
    string ProductId,
    string ProductLabel,
    string Kind,
    string? Meat,
    string? PizzaVariant,
    IReadOnlyList<string> Sauces,
    int PriceCents,
    string PriceLabel,
    string? Extra,
    bool IsPickup,
    string Detail
);
