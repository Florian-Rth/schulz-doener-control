using Schulz.DoenerControl.Core.Enums;

namespace Schulz.DoenerControl.Core.Entities;

// The cross-day debt ledger. Not derivable (settlement happens off-platform via PayPal and
// is marked manually), so it is stored. OrderId / OrderDayId are nullable for ad-hoc debts.
public sealed class Debt
{
    public Guid Id { get; set; }

    public Guid DebtorUserId { get; set; }

    public Guid CreditorUserId { get; set; }

    public Guid? OrderId { get; set; }

    public Guid? OrderDayId { get; set; }

    public int AmountCents { get; set; }

    public required string Reason { get; set; }

    public PaymentStatus Status { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset? SettledAt { get; set; }

    public User? DebtorUser { get; set; }

    public User? CreditorUser { get; set; }

    public Order? Order { get; set; }

    public OrderDay? OrderDay { get; set; }
}
