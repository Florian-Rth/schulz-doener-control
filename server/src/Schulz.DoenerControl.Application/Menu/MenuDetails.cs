using Schulz.DoenerControl.Core.Entities;

namespace Schulz.DoenerControl.Application.Menu;

// The whole order vocabulary in one shape, scoped to the single active store: the food categories
// (each with its ordered, generic fields → options) plus the available menu items. Replaces the old
// closed sauce/meat enums + pizza-variant catalog with the configurable Category → Field → Option
// engine, so the SPA renders any store's form generically.
public sealed record MenuDetails(
    IReadOnlyList<MenuCategoryDetails> Categories,
    IReadOnlyList<MenuItemSummary> Items
);

public sealed record MenuCategoryDetails(
    string Key,
    string Name,
    int SortOrder,
    IReadOnlyList<MenuFieldDetails> Fields
);

// Type/Display are lowercase wire tokens (single/multi/text, segmented/chips/dropdown/textarea) the
// generic FieldRenderer branches on. MaxLength applies to text fields only.
public sealed record MenuFieldDetails(
    string Key,
    string Label,
    string Type,
    string Display,
    int? MaxLength,
    bool Required,
    IReadOnlyList<MenuOptionDetails> Options
);

public sealed record MenuOptionDetails(string Key, string Label, string? Icon, int PriceDeltaCents);
