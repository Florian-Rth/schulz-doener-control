namespace Schulz.DoenerControl.Application.Debts;

// Creates a manual debt not tied to any order (the mock's "Ayran-Schulden"). The caller is the
// debtor; they owe CreditorUserId the amount. OrderId/OrderDayId stay null; Status starts Open.
public sealed record CreateAdHocDebtCommand(
    Guid CallerUserId,
    Guid CreditorUserId,
    int AmountCents,
    string Reason
);
