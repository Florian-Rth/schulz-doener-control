using System.Diagnostics.Contracts;

namespace Schulz.DoenerControl.Application.Calculators;

// Assigns a stable avatar colour to a freshly provisioned account. The colour is derived
// deterministically from the normalized username so the same person always renders in the same
// hue, drawn from the curated Machine-Eye-friendly palette the seed data uses.
public static class AvatarColorPalette
{
    private static readonly string[] Colors =
    [
        "#00728E",
        "#ED701C",
        "#45B8A1",
        "#7B4FB0",
        "#2E7D32",
        "#C2185B",
        "#1565C0",
        "#00897B",
        "#5D4037",
        "#F9A825",
        "#455A64",
        "#8E24AA",
    ];

    [Pure]
    public static string ForUsername(string normalizedUserName)
    {
        var hash = 0;
        foreach (var character in normalizedUserName)
            hash = unchecked((hash * 31) + character);

        var index = (hash & int.MaxValue) % Colors.Length;
        return Colors[index];
    }
}
