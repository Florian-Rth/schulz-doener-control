namespace Schulz.DoenerControl.Application.Orders;

// The success-screen summary, server-driven from a single order id. The order is multi-line: Lines
// carries each ordered item; PriceCents is the order TOTAL. When the caller is not the collector
// they owe the collector (Abholer) their own order total, but paying happens later on the home
// screen once the Abholer closes ordering — so no pay link is surfaced here. When the caller IS the
// collector they collect CollectCents from CollectCount colleagues.
public sealed record OrderResultDetails(
    IReadOnlyList<OrderResultLineDetails> Lines,
    int PriceCents,
    bool IsPickup,
    AbholerDetails? Abholer,
    int CollectCents,
    int CollectCount
);

// One ordered item on the success screen. PriceCents is the per-unit price; LineTotalCents is
// Quantity * per-unit.
public sealed record OrderResultLineDetails(
    string ProductLabel,
    string Detail,
    int Quantity,
    int PriceCents,
    int LineTotalCents
);

// The day's designated collector, as shown on the success screen's "pay the Abholer" card. Null on
// the result when no collector is designated yet (e.g. nobody has claimed pickup). PayPalHandle is a
// display field: the collector's reconstructed base PayPal link (never the bare handle); the success
// screen no longer renders a pay button (that lives on the home screen after ordering closes).
public sealed record AbholerDetails(
    string Name,
    string Initials,
    string ColorHex,
    string? PayPalHandle
);
