namespace Schulz.DoenerControl.Application.OrderDays;

// The latest Glücksrad spin of the day, projected relative to the caller. SpinId lets the client
// remember which spin it has already watched; Candidates are the wheel's slices in a stable order
// with exactly one IsChosen. CanExcuse is true only for the chosen person while a re-spin is still
// possible. ExcusedNames lists everyone who talked their way out today, oldest first.
public sealed record PickupWheelDetails(
    Guid SpinId,
    int Round,
    IReadOnlyList<WheelCandidateSummary> Candidates,
    string ChosenName,
    bool AmIChosen,
    bool CanExcuse,
    IReadOnlyList<string> ExcusedNames
);

public sealed record WheelCandidateSummary(
    string Name,
    string Initials,
    string ColorHex,
    bool IsChosen
);
