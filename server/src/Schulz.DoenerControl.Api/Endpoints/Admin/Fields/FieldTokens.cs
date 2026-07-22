namespace Schulz.DoenerControl.Api.Endpoints.Admin.Fields;

// The accepted wire tokens for a field's type and display, shared by the field endpoint validators so
// a bad token is a 400 before the request ever reaches the service. Mirrors the string mapping the
// MenuService / GenericMenuSeeder use.
internal static class FieldTokens
{
    private static readonly IReadOnlySet<string> Types = new HashSet<string>(StringComparer.Ordinal)
    {
        "single",
        "multi",
        "text",
    };

    private static readonly IReadOnlySet<string> Displays = new HashSet<string>(
        StringComparer.Ordinal
    )
    {
        "segmented",
        "chips",
        "dropdown",
        "textarea",
    };

    public static bool IsValidType(string? token) => token is not null && Types.Contains(token);

    public static bool IsValidDisplay(string? token) =>
        token is not null && Displays.Contains(token);
}
