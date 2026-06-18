namespace Schulz.DoenerControl.Application.Orders;

// The success-screen summary, server-driven from a single order id. When the caller is not the
// collector they owe the collector (Abholer) their own order price → MyPayPalUrl deep-links the
// payment. When the caller IS the collector they collect CollectCents from CollectCount colleagues.
public sealed record OrderResultDetails(
    string ProductLabel,
    int PriceCents,
    string Detail,
    bool IsPickup,
    AbholerDetails? Abholer,
    int CollectCents,
    int CollectCount,
    string? MyPayPalUrl
);

// The day's designated collector, as shown on the success screen's "pay the Abholer" card. Null on
// the result when no collector is designated yet (e.g. nobody has claimed pickup).
public sealed record AbholerDetails(
    string Name,
    string Initials,
    string ColorHex,
    string? PayPalHandle
);
