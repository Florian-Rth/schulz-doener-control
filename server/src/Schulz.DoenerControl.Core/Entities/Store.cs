namespace Schulz.DoenerControl.Core.Entities;

// A single shop the office orders from. The app is multi-store from the ground up: every OrderDay
// (and, once the generic menu lands, every Category/FieldDefinition/MenuItem) is scoped to a Store.
// Key is the stable, human-readable identity the seeder upserts against and must never change once
// created; Name/SortOrder/IsActive are ordinary admin-editable presentation data. The store-selector
// UI is deferred, so today there is exactly one active store and everything resolves to it.
public sealed class Store
{
    public Guid Id { get; set; }

    public required string Key { get; set; }

    public required string Name { get; set; }

    public int SortOrder { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTimeOffset CreatedAt { get; set; }
}
