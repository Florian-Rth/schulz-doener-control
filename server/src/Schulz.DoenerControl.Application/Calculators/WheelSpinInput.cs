namespace Schulz.DoenerControl.Application.Calculators;

public sealed record WheelSpinInput(
    int Round,
    Guid ChosenUserId,
    DateTimeOffset SpunAt,
    bool IsExcused
);
