using Schulz.DoenerControl.Core.Enums;

namespace Schulz.DoenerControl.Core.Entities;

// Seeded reference data (not an enum): the menu the order screen renders, with prices,
// icons, notes and the insider badge. Order.ProductId is a FK onto Id.
public sealed class MenuItem
{
    public required string Id { get; set; }

    public required string Name { get; set; }

    public int DefaultPriceCents { get; set; }

    public ProductKind Kind { get; set; }

    public required string MaterialIcon { get; set; }

    public string? Note { get; set; }

    public bool IsInsider { get; set; }

    public int SortOrder { get; set; }
}
