namespace Schulz.DoenerControl.Core.Entities;

// One selectable option of a select-type FieldDefinition (kalb/haehnchen/gemischt, kraeuter/…,
// margherita/…). Key is the stable wire value an answer carries and the seed identity, unique per
// field; the reserved meat/sauce option keys are immutable (Tier contract). Icon is an optional
// emoji/Material symbol; PriceDeltaCents is added to the line's suggested price when selected (0 for
// most). IsAvailable gates whether the option is offered on the public order form.
public sealed class FieldOption
{
    public Guid Id { get; set; }

    public Guid FieldDefinitionId { get; set; }

    public required string Key { get; set; }

    public required string Label { get; set; }

    public string? Icon { get; set; }

    public int PriceDeltaCents { get; set; }

    public int SortOrder { get; set; }

    public bool IsAvailable { get; set; } = true;

    public FieldDefinition? FieldDefinition { get; set; }
}
