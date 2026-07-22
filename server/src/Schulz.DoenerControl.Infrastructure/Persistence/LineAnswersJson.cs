using System.Text.Json;
using System.Text.Json.Serialization;
using Schulz.DoenerControl.Core.Entities;

namespace Schulz.DoenerControl.Infrastructure.Persistence;

// The single canonical (de)serialiser for the answers payload, shared by the EF value converter and
// anywhere else that needs the exact on-the-wire/on-disk shape:
//   { "<fieldKey>": { "options": ["kalb"], "text": "…" } }
// Empty option lists and null text are omitted, so a field with no answer is simply absent. This
// mirrors the migration's SQLite json_object backfill and the client's Zod answers shape byte-for-byte.
public static class LineAnswersJson
{
    private static readonly JsonSerializerOptions Options = new()
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    public static string Serialize(LineAnswers answers)
    {
        var payload = answers.Fields.ToDictionary(
            pair => pair.Key,
            pair => new AnswerJson(
                pair.Value.Options.Count == 0 ? null : [.. pair.Value.Options],
                string.IsNullOrEmpty(pair.Value.Text) ? null : pair.Value.Text
            )
        );
        return JsonSerializer.Serialize(payload, Options);
    }

    public static LineAnswers Deserialize(string? json)
    {
        if (string.IsNullOrWhiteSpace(json) || json == "{}")
            return LineAnswers.Empty;

        var payload = JsonSerializer.Deserialize<Dictionary<string, AnswerJson>>(json, Options);
        if (payload is null || payload.Count == 0)
            return LineAnswers.Empty;

        var fields = payload.ToDictionary(
            pair => pair.Key,
            pair => new AnswerValue(pair.Value.Options ?? [], pair.Value.Text)
        );
        return new LineAnswers(fields);
    }

    private sealed record AnswerJson(
        [property: JsonPropertyName("options")] IReadOnlyList<string>? Options,
        [property: JsonPropertyName("text")] string? Text
    );
}
