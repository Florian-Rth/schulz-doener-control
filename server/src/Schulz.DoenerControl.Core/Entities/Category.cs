namespace Schulz.DoenerControl.Core.Entities;

// A food category within a store (Döner, Dönerbox, Pizza, …), replacing the hard-coded ProductKind
// enum. It owns the ordered set of fields the order form shows for its items (via CategoryField) and
// gates their availability. Key is the stable seed identity, unique per store, and never renamed once
// created; Name/SortOrder/IsAvailable are ordinary admin-editable data.
public sealed class Category
{
    public Guid Id { get; set; }

    public Guid StoreId { get; set; }

    public required string Key { get; set; }

    public required string Name { get; set; }

    public int SortOrder { get; set; }

    public bool IsAvailable { get; set; } = true;

    public Store? Store { get; set; }

    public ICollection<CategoryField>? Fields { get; set; }
}
