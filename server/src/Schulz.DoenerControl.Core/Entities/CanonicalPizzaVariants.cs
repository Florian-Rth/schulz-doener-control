namespace Schulz.DoenerControl.Core.Entities;

// The 5 canonical pizza sorts and their FIXED Guids. These ids are the stable wire `value` the order
// form carries for a pizza line and the seed identities the EditablePizzaVariants migration plants,
// so they must never change. The migration also maps the retired enum's int values (1..5) onto these
// ids; CanonicalDefinition.LegacyEnumValue records that mapping.
public static class CanonicalPizzaVariants
{
    public static readonly IReadOnlyList<CanonicalPizzaVariant> All = new[]
    {
        new CanonicalPizzaVariant(new Guid("b1a7c0de-0001-4a01-9a01-000000000001"), "Salami", 1),
        new CanonicalPizzaVariant(
            new Guid("b1a7c0de-0002-4a02-9a02-000000000002"),
            "Margherita",
            2
        ),
        new CanonicalPizzaVariant(new Guid("b1a7c0de-0003-4a03-9a03-000000000003"), "Funghi", 3),
        new CanonicalPizzaVariant(new Guid("b1a7c0de-0004-4a04-9a04-000000000004"), "Tonno", 4),
        new CanonicalPizzaVariant(new Guid("b1a7c0de-0005-4a05-9a05-000000000005"), "Hawaii", 5),
    };
}

// One canonical pizza-variant seed row. LegacyEnumValue is the retired Core.Enums.PizzaVariant int
// the EditablePizzaVariants migration backfills any existing OrderLine.PizzaVariant onto.
public sealed record CanonicalPizzaVariant(Guid Id, string Name, int LegacyEnumValue);
