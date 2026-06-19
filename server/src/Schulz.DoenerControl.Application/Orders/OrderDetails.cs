namespace Schulz.DoenerControl.Application.Orders;

// A single order projection for the order-screen edit flow and the upsert/pickup responses. The
// order is multi-line: every line carries its own product label, money and quantity; the header
// exposes the order total both as cents and the German label so the UI never reformats it.
public sealed record OrderDetails(
    Guid Id,
    Guid OrderDayId,
    IReadOnlyList<OrderLineDetails> Lines,
    int PriceCents,
    string PriceLabel,
    bool IsPickup
);

// A single line of an order. PriceCents is the per-UNIT price; LineTotalCents is Quantity * per-unit.
// ProductLabel/Detail mirror the mock's productLabel/detail builders for this line.
public sealed record OrderLineDetails(
    string ProductId,
    string ProductLabel,
    string Kind,
    string? Meat,
    string? PizzaVariant,
    IReadOnlyList<string> Sauces,
    int PriceCents,
    string PriceLabel,
    string? Extra,
    int Quantity,
    int LineTotalCents,
    string LineTotalLabel,
    string Detail
);
