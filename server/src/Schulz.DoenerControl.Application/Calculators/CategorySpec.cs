using Schulz.DoenerControl.Core.Enums;

namespace Schulz.DoenerControl.Application.Calculators;

// The Application-layer projection of a Category's field configuration, resolved once by the
// Infrastructure services from the Category / CategoryField / FieldDefinition / FieldOption rows and
// then fed to the pure ordering calculators (AnswerValidator, LinePriceCalculator, OrderLabelBuilder)
// so those never touch EF entities. Fields are in CategoryField.SortOrder; each field's Options are
// in FieldOption.SortOrder.
public sealed record CategorySpec(string Key, IReadOnlyList<FieldSpec> Fields)
{
    public FieldSpec? Field(string fieldKey) =>
        Fields.FirstOrDefault(field => field.Key == fieldKey);

    public bool HasField(string fieldKey) => Fields.Any(field => field.Key == fieldKey);
}

public sealed record FieldSpec(
    string Key,
    string Label,
    FieldType Type,
    FieldDisplay Display,
    bool Required,
    int? MaxLength,
    IReadOnlyList<OptionSpec> Options
)
{
    public OptionSpec? Option(string optionKey) =>
        Options.FirstOrDefault(option => option.Key == optionKey);

    public bool IsSelect => Type is FieldType.SingleSelect or FieldType.MultiSelect;
}

public sealed record OptionSpec(
    string Key,
    string Label,
    string? Icon,
    int PriceDeltaCents,
    bool IsAvailable
);
