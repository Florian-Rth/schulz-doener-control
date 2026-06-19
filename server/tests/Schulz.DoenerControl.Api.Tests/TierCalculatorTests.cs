using Schulz.DoenerControl.Application.Calculators;
using Schulz.DoenerControl.Core.Enums;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests;

// Pure-logic unit tests for the ported computeTier: no DB, no host. Exercises every one of the
// 15 priority branches plus the canonical Markus 12-order fixture (garlic ~0.92 >= 0.7,
// spicy ~0.42 < 0.6 => "Der Knoblauch-Wolf").
public sealed class TierCalculatorTests
{
    private static TierOrderInput Doener(
        MeatType? meat,
        Sauce sauces,
        string productId = "doener"
    ) => new(productId, ProductKind.Doener, meat, sauces);

    private static TierOrderInput Pizza() => new("pizza", ProductKind.Pizza, null, Sauce.None);

    private static IReadOnlyList<TierOrderInput> Repeat(TierOrderInput order, int count) =>
        Enumerable.Repeat(order, count).ToArray();

    // The Chef's exact 12-order history from the mock (MY_HISTORY).
    private static IReadOnlyList<TierOrderInput> MarkusHistory() =>
        new[]
        {
            Doener(MeatType.Kalb, Sauce.Knoblauch | Sauce.Kraeuter),
            Doener(MeatType.Kalb, Sauce.Knoblauch | Sauce.Scharf),
            Doener(MeatType.Kalb, Sauce.Knoblauch | Sauce.Kraeuter | Sauce.Scharf, "duerum"),
            Doener(MeatType.Kalb, Sauce.Knoblauch),
            Doener(MeatType.Kalb, Sauce.Knoblauch | Sauce.Scharf, "big"),
            Doener(MeatType.Haehnchen, Sauce.Knoblauch | Sauce.Kraeuter),
            Doener(MeatType.Kalb, Sauce.Knoblauch, "box"),
            Doener(MeatType.Kalb, Sauce.Kraeuter),
            Doener(MeatType.Kalb, Sauce.Knoblauch | Sauce.Scharf),
            Doener(MeatType.Kalb, Sauce.Knoblauch | Sauce.Kraeuter, "duerum"),
            Doener(MeatType.Kalb, Sauce.Knoblauch | Sauce.Scharf),
            Doener(MeatType.Kalb, Sauce.Knoblauch),
        };

    [Fact]
    public void Should_Resolve_KnoblauchWolf_When_Markus_Canonical_History()
    {
        var tier = TierCalculator.ComputeTier(MarkusHistory());

        Assert.Equal("🐺", tier.Emoji);
        Assert.Equal("Der Knoblauch-Wolf", tier.Name);
        Assert.Equal(12, tier.Count);
    }

    [Fact]
    public void Should_Resolve_Buerowaffe_When_Garlic_And_Spicy_Both_High()
    {
        // 8 of 10 orders carry both Knoblauch and Scharf => garlic 0.8, spicy 0.8.
        var history = Repeat(Doener(MeatType.Kalb, Sauce.Knoblauch | Sauce.Scharf), 8)
            .Concat(Repeat(Doener(MeatType.Kalb, Sauce.Kraeuter), 2))
            .ToArray();

        var tier = TierCalculator.ComputeTier(history);

        Assert.Equal("🦨", tier.Emoji);
        Assert.Equal("Die Bürowaffe", tier.Name);
    }

    [Fact]
    public void Should_Resolve_KnoblauchWolf_When_Garlic_High_But_Spicy_Low()
    {
        // garlic 0.8, spicy 0.2 => skips Bürowaffe (needs both >= 0.6), matches Knoblauch-Wolf.
        var history = Repeat(Doener(MeatType.Kalb, Sauce.Knoblauch), 7)
            .Append(Doener(MeatType.Kalb, Sauce.Knoblauch | Sauce.Scharf))
            .Concat(Repeat(Doener(MeatType.Kalb, Sauce.Kraeuter), 2))
            .ToArray();

        var tier = TierCalculator.ComputeTier(history);

        Assert.Equal("Der Knoblauch-Wolf", tier.Name);
    }

    [Fact]
    public void Should_Resolve_SchaerfeDrache_When_Spicy_High_And_Garlic_Low()
    {
        // spicy 0.8, garlic 0.2 => skips Bürowaffe + Knoblauch-Wolf, matches Schärfe-Drache.
        var history = Repeat(Doener(MeatType.Kalb, Sauce.Scharf), 7)
            .Append(Doener(MeatType.Kalb, Sauce.Knoblauch | Sauce.Scharf))
            .Concat(Repeat(Doener(MeatType.Kalb, Sauce.Kraeuter), 2))
            .ToArray();

        var tier = TierCalculator.ComputeTier(history);

        Assert.Equal("🐉", tier.Emoji);
        Assert.Equal("Der Schärfe-Drache", tier.Name);
    }

    [Fact]
    public void Should_Resolve_PizzaVerraeter_When_Two_Or_More_Pizzas()
    {
        // Two pizzas before the meat-loyalty / count thresholds bite.
        var history = new[] { Pizza(), Pizza(), Doener(MeatType.Kalb, Sauce.Kraeuter) };

        var tier = TierCalculator.ComputeTier(history);

        Assert.Equal("🍕", tier.Emoji);
        Assert.Equal("Der Pizza-Verräter", tier.Name);
    }

    [Fact]
    public void Should_Resolve_DannyJuenger_When_Two_Or_More_Danny()
    {
        var history = new[]
        {
            Doener(MeatType.Kalb, Sauce.Kraeuter, "danny"),
            Doener(MeatType.Kalb, Sauce.Kraeuter, "danny"),
            Doener(MeatType.Kalb, Sauce.Kraeuter),
        };

        var tier = TierCalculator.ComputeTier(history);

        Assert.Equal("📦", tier.Emoji);
        Assert.Equal("Der Danny-Jünger", tier.Name);
    }

    [Fact]
    public void Should_Resolve_BigDoenerWildsau_When_Big_Meets_Threshold()
    {
        // 3 big of 4 orders: big >= max(2, 4*0.4=1.6) => 3 >= 2. Garlic/spicy stay low.
        var history = Repeat(Doener(MeatType.Kalb, Sauce.Kraeuter, "big"), 3)
            .Append(Doener(MeatType.Kalb, Sauce.Kraeuter))
            .ToArray();

        var tier = TierCalculator.ComputeTier(history);

        Assert.Equal("🐗", tier.Emoji);
        Assert.Equal("Die Big-Döner-Wildsau", tier.Name);
    }

    [Fact]
    public void Should_Resolve_KalbRex_When_All_Meated_Are_Kalb_And_At_Least_Five()
    {
        // 5 Kalb orders, kalbR == 1, meated >= 5. Sauces kept low to avoid earlier branches.
        var history = Repeat(Doener(MeatType.Kalb, Sauce.Kraeuter), 5);

        var tier = TierCalculator.ComputeTier(history);

        Assert.Equal("🦖", tier.Emoji);
        Assert.Equal("Der Kalb-Rex", tier.Name);
    }

    [Fact]
    public void Should_Resolve_AngstHaehnchen_When_All_Meated_Are_Haehnchen_And_At_Least_Five()
    {
        var history = Repeat(Doener(MeatType.Haehnchen, Sauce.Kraeuter), 5);

        var tier = TierCalculator.ComputeTier(history);

        Assert.Equal("🐔", tier.Emoji);
        Assert.Equal("Das Angst-Hähnchen", tier.Name);
    }

    [Fact]
    public void Should_Resolve_SossenMessie_When_Half_Have_All_Three_Sauces()
    {
        // Mixed meat so kalbR/haehnR != 1; 2 of 4 carry all three sauces => allThree 0.5.
        var history = new[]
        {
            Doener(MeatType.Kalb, Sauce.Kraeuter | Sauce.Knoblauch | Sauce.Scharf),
            Doener(MeatType.Haehnchen, Sauce.Kraeuter | Sauce.Knoblauch | Sauce.Scharf),
            Doener(MeatType.Kalb, Sauce.Kraeuter),
            Doener(MeatType.Haehnchen, Sauce.Kraeuter),
        };

        var tier = TierCalculator.ComputeTier(history);

        Assert.Equal("🐙", tier.Emoji);
        Assert.Equal("Der Soßen-Messie", tier.Name);
    }

    [Fact]
    public void Should_Resolve_Trockenmaus_When_Half_Of_Doener_Have_No_Sauce()
    {
        // Mixed meat; 2 of 4 doener-kind orders carry no sauce => noSauce 0.5.
        var history = new[]
        {
            Doener(MeatType.Kalb, Sauce.None),
            Doener(MeatType.Haehnchen, Sauce.None),
            Doener(MeatType.Kalb, Sauce.Kraeuter),
            Doener(MeatType.Haehnchen, Sauce.Kraeuter),
        };

        var tier = TierCalculator.ComputeTier(history);

        Assert.Equal("🐭", tier.Emoji);
        Assert.Equal("Die Trockenmaus", tier.Name);
    }

    [Fact]
    public void Should_Resolve_DuerumAdler_When_Duerum_Meets_Threshold()
    {
        // 3 duerum of 4: duerum >= max(2, 4*0.5=2) => 3 >= 2. Mixed meat, low sauce.
        var history = Repeat(Doener(MeatType.Kalb, Sauce.Kraeuter, "duerum"), 3)
            .Append(Doener(MeatType.Haehnchen, Sauce.Kraeuter))
            .ToArray();

        var tier = TierCalculator.ComputeTier(history);

        Assert.Equal("🦅", tier.Emoji);
        Assert.Equal("Der Dürüm-Adler", tier.Name);
    }

    [Fact]
    public void Should_Resolve_PommesBiber_When_Box_Meets_Threshold()
    {
        // 3 box of 5: box >= max(2, 5*0.4=2) => 3 >= 2. Duerum stays below its 0.5 threshold.
        var history = Repeat(Doener(MeatType.Kalb, Sauce.Kraeuter, "box"), 3)
            .Concat(Repeat(Doener(MeatType.Haehnchen, Sauce.Kraeuter), 2))
            .ToArray();

        var tier = TierCalculator.ComputeTier(history);

        Assert.Equal("🦫", tier.Emoji);
        Assert.Equal("Der Pommes-Biber", tier.Name);
    }

    [Fact]
    public void Should_Resolve_ChaosAeffchen_When_Five_Distinct_Products()
    {
        // 5 distinct productIds, none repeated enough to trip earlier branches; mixed meat.
        var history = new[]
        {
            Doener(MeatType.Kalb, Sauce.Kraeuter, "doener"),
            Doener(MeatType.Haehnchen, Sauce.Kraeuter, "duerum"),
            Doener(MeatType.Kalb, Sauce.Kraeuter, "big"),
            Doener(MeatType.Haehnchen, Sauce.Kraeuter, "box"),
            Doener(MeatType.Kalb, Sauce.Kraeuter, "danny"),
        };

        var tier = TierCalculator.ComputeTier(history);

        Assert.Equal("🐒", tier.Emoji);
        Assert.Equal("Das Chaos-Äffchen", tier.Name);
    }

    [Fact]
    public void Should_Resolve_GewohnheitsFaultier_When_Single_Product_And_At_Least_Five()
    {
        // uniq == 1, n == 6, mixed meat so kalbR/haehnR != 1 (skips Kalb-Rex/Angst-Hähnchen);
        // sauce kept the same product but varied to avoid noSauce/allThree.
        var history = Repeat(Doener(MeatType.Kalb, Sauce.Kraeuter), 3)
            .Concat(Repeat(Doener(MeatType.Haehnchen, Sauce.Kraeuter), 3))
            .ToArray();

        var tier = TierCalculator.ComputeTier(history);

        Assert.Equal("🦥", tier.Emoji);
        Assert.Equal("Das Gewohnheits-Faultier", tier.Name);
    }

    [Fact]
    public void Should_Resolve_SoliderDoenerBuerger_When_Nothing_Else_Matches()
    {
        // 2 distinct products, n == 4, mixed meat, light sauces; only one duerum so the Dürüm-Adler
        // threshold (>= max(2, n*0.5)) is not met => fallback.
        var history = new[]
        {
            Doener(MeatType.Kalb, Sauce.Kraeuter, "doener"),
            Doener(MeatType.Haehnchen, Sauce.Knoblauch, "doener"),
            Doener(MeatType.Kalb, Sauce.Kraeuter, "doener"),
            Doener(MeatType.Haehnchen, Sauce.Kraeuter, "duerum"),
        };

        var tier = TierCalculator.ComputeTier(history);

        Assert.Equal("🌯", tier.Emoji);
        Assert.Equal("Der solide Döner-Bürger", tier.Name);
    }

    [Fact]
    public void Should_Resolve_SoliderDoenerBuerger_When_History_Is_Empty()
    {
        var tier = TierCalculator.ComputeTier(Array.Empty<TierOrderInput>());

        Assert.Equal("Der solide Döner-Bürger", tier.Name);
        Assert.Equal(0, tier.Count);
    }

    [Fact]
    public void Should_Expose_All_Fifteen_Tiers_In_Priority_Order()
    {
        var catalog = TierCalculator.Catalog;

        Assert.Equal(15, catalog.Count);
        Assert.Equal("Die Bürowaffe", catalog[0].Name);
        Assert.Equal("Der Knoblauch-Wolf", catalog[1].Name);
        Assert.Equal("Der solide Döner-Bürger", catalog[14].Name);
    }

    [Fact]
    public void Should_Carry_A_German_Condition_For_Every_Tier()
    {
        var catalog = TierCalculator.Catalog;

        Assert.All(catalog, tier => Assert.False(string.IsNullOrWhiteSpace(tier.Condition)));
    }

    [Fact]
    public void Should_Render_Condition_Percentages_From_The_Comparison_Thresholds()
    {
        var catalog = TierCalculator.Catalog;

        // The Knoblauch-Wolf branch compares garlic >= 0.7; the human-readable condition is rendered
        // from that very constant, so it reads as a real percentage rather than a duplicated literal.
        Assert.Equal("Knoblauch-Anteil ≥ 70 %", catalog[1].Condition);
        Assert.Equal("Schärfe-Anteil ≥ 70 %", catalog[2].Condition);
        Assert.Equal("Wenn keine andere Regel zutrifft", catalog[14].Condition);
    }
}
