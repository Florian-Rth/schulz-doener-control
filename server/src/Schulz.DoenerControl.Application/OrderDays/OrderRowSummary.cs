namespace Schulz.DoenerControl.Application.OrderDays;

// One participant's order as shown in the Döner-Tag list. ProductLabel and Description mirror the
// mock's productLabel/detail builders; money is exposed both as cents and the German label.
public sealed record OrderRowSummary(
    Guid OrderId,
    string PersonName,
    string Initials,
    string AvatarColorHex,
    string ProductLabel,
    string Description,
    int PriceCents,
    string PriceLabel,
    bool IsMine,
    bool IsPickup
);
