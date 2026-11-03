using System.Diagnostics.Contracts;
using Schulz.DoenerControl.Core;
using Schulz.DoenerControl.Core.Entities;
using Schulz.DoenerControl.Core.Enums;

namespace Schulz.DoenerControl.Application.Calculators;

// The single write-boundary guard for a submitted answers map against its category's field defs,
// replacing the old NormalizeForKind + endpoint whitelist validators + OrderVocabularyParser. Pure:
// given the category spec and the submitted answers it returns a validation Result, never touching
// EF or throwing. Client-side Zod is the mirror guardrail; this is authoritative.
public static class AnswerValidator
{
    [Pure]
    public static Result Validate(CategorySpec category, LineAnswers answers)
    {
        // No unknown field keys: every answered key must belong to the category.
        foreach (var fieldKey in answers.Fields.Keys)
        {
            if (!category.HasField(fieldKey))
                return Result.Validation($"Unbekanntes Feld '{fieldKey}'.");
        }

        foreach (var field in category.Fields)
        {
            var result = ValidateField(field, answers);
            if (!result.IsSuccess)
                return result;
        }

        return Result.Success();
    }

    [Pure]
    private static Result ValidateField(FieldSpec field, LineAnswers answers)
    {
        var options = answers.OptionsFor(field.Key);
        var text = answers.TextFor(field.Key);
        var answered =
            field.Type == FieldType.Text ? !string.IsNullOrWhiteSpace(text) : options.Count > 0;

        if (field.Required && !answered)
            return Result.Validation($"Feld '{field.Label}' ist erforderlich.");

        return field.Type switch
        {
            FieldType.SingleSelect => ValidateSingleSelect(field, options, text),
            FieldType.MultiSelect => ValidateMultiSelect(field, options, text),
            FieldType.Text => ValidateText(field, options, text),
            _ => Result.Validation($"Unbekannter Feldtyp für '{field.Label}'."),
        };
    }

    [Pure]
    private static Result ValidateSingleSelect(
        FieldSpec field,
        IReadOnlyList<string> options,
        string? text
    )
    {
        if (!string.IsNullOrEmpty(text))
            return Result.Validation($"Feld '{field.Label}' erlaubt keinen Freitext.");
        if (options.Count == 0)
            return Result.Success();
        if (options.Count > 1)
            return Result.Validation($"Feld '{field.Label}' erlaubt nur eine Auswahl.");
        return OptionAvailable(field, options[0]);
    }

    [Pure]
    private static Result ValidateMultiSelect(
        FieldSpec field,
        IReadOnlyList<string> options,
        string? text
    )
    {
        if (!string.IsNullOrEmpty(text))
            return Result.Validation($"Feld '{field.Label}' erlaubt keinen Freitext.");
        if (options.Distinct().Count() != options.Count)
            return Result.Validation($"Feld '{field.Label}' enthält doppelte Auswahl.");
        foreach (var option in options)
        {
            var available = OptionAvailable(field, option);
            if (!available.IsSuccess)
                return available;
        }
        return Result.Success();
    }

    [Pure]
    private static Result ValidateText(FieldSpec field, IReadOnlyList<string> options, string? text)
    {
        if (options.Count > 0)
            return Result.Validation($"Feld '{field.Label}' erwartet Freitext, keine Auswahl.");
        if (field.MaxLength is { } max && text is not null && text.Length > max)
            return Result.Validation($"Feld '{field.Label}' ist zu lang (max. {max} Zeichen).");
        return Result.Success();
    }

    [Pure]
    private static Result OptionAvailable(FieldSpec field, string optionKey)
    {
        var option = field.Option(optionKey);
        if (option is null || !option.IsAvailable)
            return Result.Validation($"Unbekannte Auswahl '{optionKey}' für '{field.Label}'.");
        return Result.Success();
    }
}
