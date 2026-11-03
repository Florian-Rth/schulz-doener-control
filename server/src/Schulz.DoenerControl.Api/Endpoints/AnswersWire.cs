using System.Text.Json.Serialization;
using Schulz.DoenerControl.Core.Entities;

namespace Schulz.DoenerControl.Api.Endpoints;

// The wire shape of the answers payload, shared by the menu (preset defaults), order responses and
// the order-write request: a map of field key → { options, text }, mirroring LineAnswers' JSON.
// Null Options/Text are omitted on the way out (the JsonIgnore keeps the emitted shape matching the
// client's `{ options?, text? }` contract) and tolerated on the way in.
public sealed record AnswerFieldDto(
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        IReadOnlyList<string>? Options,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] string? Text
);

public static class AnswersWire
{
    public static IReadOnlyDictionary<string, AnswerFieldDto> ToDto(LineAnswers answers) =>
        answers.Fields.ToDictionary(
            pair => pair.Key,
            pair => new AnswerFieldDto(
                pair.Value.Options.Count == 0 ? null : pair.Value.Options,
                string.IsNullOrEmpty(pair.Value.Text) ? null : pair.Value.Text
            )
        );

    public static IReadOnlyDictionary<string, AnswerFieldDto>? ToDtoOrNull(LineAnswers? answers) =>
        answers is null ? null : ToDto(answers);

    // Preserves the null/absent distinction for optional payloads (e.g. a non-preset item has no
    // default answers at all, rather than an empty object).
    public static LineAnswers? FromDtoOrNull(IReadOnlyDictionary<string, AnswerFieldDto>? dto) =>
        dto is null ? null : FromDto(dto);

    public static LineAnswers FromDto(IReadOnlyDictionary<string, AnswerFieldDto>? dto)
    {
        if (dto is null || dto.Count == 0)
            return LineAnswers.Empty;

        var fields = dto.ToDictionary(
            pair => pair.Key,
            pair => new AnswerValue(pair.Value.Options ?? [], pair.Value.Text)
        );
        return new LineAnswers(fields);
    }
}
