using Schulz.DoenerControl.Application.Debts;

namespace Schulz.DoenerControl.Api.Endpoints.Debts;

// Endpoint-layer projection of one debt-ledger row. PersonName/Initials/AvatarColorHex describe the
// other party (the creditor on "what I owe", the debtor on "owed to me"). Shared by the two ledger
// responses; mapped from the Application DebtSummary so the service type never leaks.
public sealed record DebtSummaryDto(
    Guid Id,
    string PersonName,
    string Initials,
    string AvatarColorHex,
    string Reason,
    string? DayLabel,
    int AmountCents,
    string AmountLabel,
    string? PaypalUrl,
    DateTimeOffset CreatedAt
);

public sealed record DebtDetailsDto(
    Guid Id,
    string Status,
    DateTimeOffset? SettledAt,
    int AmountCents,
    string Reason
);

// Endpoint-layer projection of one settled payment in the caller's history. PersonName/Initials/
// AvatarColorHex describe the creditor (the colleague the caller paid). Mapped from the Application
// DebtHistorySummary so the service type never leaks.
public sealed record DebtHistoryDto(
    string PersonName,
    string Initials,
    string AvatarColorHex,
    int AmountCents,
    string AmountLabel,
    DateTimeOffset SettledAt,
    string Reason
);

public static class DebtMapper
{
    public static DebtSummaryDto ToRowDto(DebtSummary summary) =>
        new(
            summary.Id,
            summary.PersonName,
            summary.Initials,
            summary.AvatarColorHex,
            summary.Reason,
            summary.DayLabel,
            summary.AmountCents,
            summary.AmountLabel,
            summary.PaypalUrl,
            summary.CreatedAt
        );

    public static DebtDetailsDto ToDetailsDto(DebtDetails details) =>
        new(details.Id, details.Status, details.SettledAt, details.AmountCents, details.Reason);

    public static DebtHistoryDto ToHistoryDto(DebtHistorySummary summary) =>
        new(
            summary.PersonName,
            summary.Initials,
            summary.AvatarColorHex,
            summary.AmountCents,
            summary.AmountLabel,
            summary.SettledAt,
            summary.Reason
        );
}
