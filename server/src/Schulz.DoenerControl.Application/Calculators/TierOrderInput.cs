using Schulz.DoenerControl.Core.Enums;

namespace Schulz.DoenerControl.Application.Calculators;

// The per-order facts the tier math reads, projected from an Order without leaking the entity
// across the service boundary. Sauces are flags so garlic/spicy/noSauce/allThree are bitwise.
public sealed record TierOrderInput(
    string ProductId,
    ProductKind Kind,
    MeatType? Meat,
    Sauce Sauces
);
