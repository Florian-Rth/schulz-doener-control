using FluentValidation;
using Schulz.DoenerControl.Application.Calculators;

namespace Schulz.DoenerControl.Api.Validation;

// Shared rule for the PayPal setting across every endpoint that captures it (profile, self-register,
// admin create/edit). The user enters their full PayPal LINK; the app parses the handle out of it
// (PayPalLinkParser) and stores only the handle. So the rule requires a PARSEABLE PayPal link — one
// the parser can read a handle from — rather than a bare handle. Empty/blank clears it.
public static class PayPalLinkRules
{
    public const int MaxLength = 256;

    public const string Message =
        "Bitte gib deinen PayPal-Link ein (z. B. https://paypal.me/deinname), aus dem wir deinen Namen lesen koennen.";

    public static IRuleBuilderOptions<T, string?> PayPalLink<T>(
        this IRuleBuilder<T, string?> rule
    ) =>
        rule.MaximumLength(MaxLength)
            .WithMessage(Message)
            .Must(IsParseableLink)
            .WithMessage(Message);

    private static bool IsParseableLink(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return true;

        return PayPalLinkParser.TryParseHandle(value, out _);
    }
}
