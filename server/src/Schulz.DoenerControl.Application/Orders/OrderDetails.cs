using Schulz.DoenerControl.Core.Entities;

namespace Schulz.DoenerControl.Application.Orders;

// A single order projection for the order-screen edit flow and the upsert/pickup responses. The
// order is multi-line: every line carries its own product label, answers, money and quantity; the
// header exposes the order total both as cents and the German label so the UI never reformats it.
public sealed record OrderDetails(
    Guid Id,
    Guid OrderDayId,
    IReadOnlyList<OrderLineDetails> Lines,
    int PriceCents,
    string PriceLabel,
    bool IsPickup
);

// A single line of an order. PriceCents is the per-UNIT price; LineTotalCents is Quantity * per-unit.
// Answers is the field→answer map (so the edit form can re-seed itself); ProductLabel is the item's
// own display name and Detail is the rendered option/text summary.
public sealed record OrderLineDetails(
    string ProductId,
    string ProductLabel,
    LineAnswers Answers,
    int PriceCents,
    string PriceLabel,
    int Quantity,
    int LineTotalCents,
    string LineTotalLabel,
    string Detail
);
