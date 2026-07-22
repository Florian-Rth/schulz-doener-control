namespace Schulz.DoenerControl.Core.Entities;

// Seeded reference data (not an enum): the menu the order screen renders, with prices, icons, notes
// and the insider badge. OrderLine.ProductId is a FK onto Id. The former ProductKind enum is gone —
// an item's fields now come from its Category. A PRESET (e.g. Danny-Box) is an ordinary item with
// BaseItemId set to the product it "is-a": it keeps its own id/name/price/icon/badge and category,
// seeds the order form from DefaultAnswers, but the kitchen sheet prints under the BASE item's name.
public sealed class MenuItem
{
    public required string Id { get; set; }

    // Nullable through the multi-store rollout (backfilled to the single store by the migration).
    public Guid? StoreId { get; set; }

    // The category whose fields this item exposes. Nullable to avoid a chicken-and-egg not-null on
    // legacy rows; an unassigned item simply renders no fields. The seeder fills it on first run.
    public Guid? CategoryId { get; set; }

    // Preset pointer: the base item this one prints as. Null for ordinary items.
    public string? BaseItemId { get; set; }

    public required string Name { get; set; }

    public int DefaultPriceCents { get; set; }

    public required string MaterialIcon { get; set; }

    public string? Note { get; set; }

    public bool IsInsider { get; set; }

    public int SortOrder { get; set; }

    // Retired items stay as rows (so past orders' FKs and history survive) but drop off the public
    // order form. Admins toggle this; the public GET /api/menu returns only available items.
    public bool IsAvailable { get; set; } = true;

    // Preset seed answers, pre-filled (still editable) on the order form when this item is chosen.
    // Null for ordinary items. Stored as JSON via the same converter as OrderLine.Answers.
    public LineAnswers? DefaultAnswers { get; set; }

    public Store? Store { get; set; }

    public Category? Category { get; set; }

    public MenuItem? BaseItem { get; set; }
}
