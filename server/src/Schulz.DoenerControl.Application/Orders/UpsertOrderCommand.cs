using Schulz.DoenerControl.Core.Entities;

namespace Schulz.DoenerControl.Application.Orders;

// Idempotent upsert of the caller's order for a day (add OR edit), allowed only while the day is
// open and before its cutoff. The order is multi-line: UpsertMineAsync REPLACES the order's whole
// line set with these lines. Each line's answers are validated against its product's category at
// write time (AnswerValidator); an invalid answer rejects the whole upsert.
public sealed record UpsertOrderCommand(
    Guid CallerUserId,
    Guid OrderDayId,
    IReadOnlyList<UpsertOrderLineCommand> Lines,
    bool IsPickup
);

// Answers is the field→answer map for the line (see LineAnswers). PriceCents is an OPTIONAL override:
// null means "use the server-computed suggested price" (item base + selected option deltas); a value
// freezes that explicit per-unit price onto the line.
public sealed record UpsertOrderLineCommand(
    string ProductId,
    LineAnswers Answers,
    int? PriceCents,
    int Quantity
);
