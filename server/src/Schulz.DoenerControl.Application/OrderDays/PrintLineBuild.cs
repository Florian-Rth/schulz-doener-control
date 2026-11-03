namespace Schulz.DoenerControl.Application.OrderDays;

// The structured answers behind a print line, so the Abholer's counter mode can rebuild the Döner in
// 3D instead of parsing the formatted description: the chosen meat option key, the sauce option keys
// (in the order chosen), and the free-text answer, which also carries the Gemüse protocol
// ("ohne Zwiebeln" / "mit allem"). IsBreadDoener tells the client whether this is a bread-based Döner
// the 3D stage should show (boxes share the meat + sauce fields but come without bread).
public sealed record PrintLineBuild(
    string? MeatKey,
    IReadOnlyList<string> SauceKeys,
    string ExtraText,
    bool IsBreadDoener
);
