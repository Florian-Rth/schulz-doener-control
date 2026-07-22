namespace Schulz.DoenerControl.Core.Entities;

// The unified answer payload stored on OrderLine.Answers and seeded onto MenuItem.DefaultAnswers,
// replacing the old typed Meat/Sauces/PizzaVariantId/Extra columns. One entry per answered field
// key; a select field carries its chosen option keys in Options, a text field carries Text. The
// JSON persisted shape (see LineAnswersConverter) is { "<fieldKey>": { "options": [...], "text": ... } }
// with empty options / null text omitted. Value semantics matter for EF change tracking, so equality
// is structural (see the explicit members) rather than the reference equality a record would give a
// dictionary.
public sealed class LineAnswers
{
    public static readonly LineAnswers Empty = new(new Dictionary<string, AnswerValue>());

    public LineAnswers(IReadOnlyDictionary<string, AnswerValue> fields)
    {
        Fields = fields;
    }

    public IReadOnlyDictionary<string, AnswerValue> Fields { get; }

    public IReadOnlyList<string> OptionsFor(string fieldKey) =>
        Fields.TryGetValue(fieldKey, out var value) ? value.Options : [];

    public string? TextFor(string fieldKey) =>
        Fields.TryGetValue(fieldKey, out var value) ? value.Text : null;

    public bool Has(string fieldKey) => Fields.ContainsKey(fieldKey);

    public override bool Equals(object? obj) =>
        obj is LineAnswers other
        && Fields.Count == other.Fields.Count
        && Fields.All(pair =>
            other.Fields.TryGetValue(pair.Key, out var value) && value.Equals(pair.Value)
        );

    public override int GetHashCode()
    {
        var hash = new HashCode();
        foreach (var pair in Fields.OrderBy(pair => pair.Key, StringComparer.Ordinal))
        {
            hash.Add(pair.Key);
            hash.Add(pair.Value);
        }
        return hash.ToHashCode();
    }
}

// A single field's answer: the chosen option keys (empty for a text field) and/or free text (null
// for a select field). Structural equality over the option list is explicit so LineAnswers equality
// — and thus EF's snapshot comparison — is a true value comparison.
public sealed class AnswerValue
{
    public AnswerValue(IReadOnlyList<string> options, string? text)
    {
        Options = options;
        Text = text;
    }

    public IReadOnlyList<string> Options { get; }

    public string? Text { get; }

    public static AnswerValue FromOptions(params string[] options) => new(options, null);

    public static AnswerValue FromText(string? text) => new([], text);

    public override bool Equals(object? obj) =>
        obj is AnswerValue other
        && Text == other.Text
        && Options.Count == other.Options.Count
        && Options.SequenceEqual(other.Options);

    public override int GetHashCode()
    {
        var hash = new HashCode();
        hash.Add(Text);
        foreach (var option in Options)
        {
            hash.Add(option);
        }
        return hash.ToHashCode();
    }
}
