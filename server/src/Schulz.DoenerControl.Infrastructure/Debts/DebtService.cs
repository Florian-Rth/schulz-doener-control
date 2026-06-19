using Microsoft.EntityFrameworkCore;
using Schulz.DoenerControl.Application.Calculators;
using Schulz.DoenerControl.Application.Debts;
using Schulz.DoenerControl.Core;
using Schulz.DoenerControl.Core.Entities;
using Schulz.DoenerControl.Core.Enums;
using Schulz.DoenerControl.Infrastructure.OrderDays;
using Schulz.DoenerControl.Infrastructure.Persistence;

namespace Schulz.DoenerControl.Infrastructure.Debts;

public sealed class DebtService : IDebtService
{
    private readonly AppDbContext database;
    private readonly OrderDayClock clock;

    public DebtService(AppDbContext database, OrderDayClock clock)
    {
        this.database = database;
        this.clock = clock;
    }

    public async Task<Result<DebtLedgerDetails>> GetOpenForDebtorAsync(
        Guid callerId,
        CancellationToken ct
    )
    {
        // Rows describe the creditor: the colleague the caller pays.
        var debts = await LoadOpenDebts(debt => debt.DebtorUserId == callerId, ct);
        var rows = debts.Select(debt => MapRow(debt, debt.CreditorUser)).ToList();
        return Result<DebtLedgerDetails>.Success(BuildLedger(rows));
    }

    public async Task<Result<DebtLedgerDetails>> GetForCreditorAsync(
        Guid callerId,
        CancellationToken ct
    )
    {
        // Rows describe the debtor: the colleague who owes the caller.
        var debts = await LoadOpenDebts(debt => debt.CreditorUserId == callerId, ct);
        var rows = debts.Select(debt => MapRow(debt, debt.DebtorUser)).ToList();
        return Result<DebtLedgerDetails>.Success(BuildLedger(rows));
    }

    public async Task<Result<IReadOnlyList<DebtHistorySummary>>> GetSettledForDebtorAsync(
        Guid callerId,
        int take,
        CancellationToken ct
    )
    {
        // SQLite cannot ORDER BY a DateTimeOffset, so load the caller's settled debts then order and
        // cap in memory (newest-settled first). Rows describe the creditor — the colleague paid.
        var settled = await database
            .Debts.AsNoTracking()
            .Include(debt => debt.CreditorUser)
            .Where(debt => debt.Status == PaymentStatus.Settled)
            .Where(debt => debt.DebtorUserId == callerId)
            .ToListAsync(ct);

        var rows = settled
            .OrderByDescending(debt => debt.SettledAt)
            .Take(take)
            .Select(debt => MapHistoryRow(debt, debt.CreditorUser))
            .ToList();

        return Result<IReadOnlyList<DebtHistorySummary>>.Success(rows);
    }

    public async Task<Result<DebtDetails>> SettleAsync(
        SettleDebtCommand command,
        CancellationToken ct
    )
    {
        var debt = await database.Debts.FirstOrDefaultAsync(d => d.Id == command.DebtId, ct);

        // The caller must be a party to the debt; otherwise it reads as not found (don't leak it).
        if (
            debt is null
            || (
                debt.DebtorUserId != command.CallerUserId
                && debt.CreditorUserId != command.CallerUserId
            )
        )
        {
            return Result<DebtDetails>.NotFound("Zahlung nicht gefunden.");
        }

        if (debt.Status == PaymentStatus.Settled)
            return Result<DebtDetails>.Conflict("Die Zahlung ist bereits beglichen.");

        debt.Status = PaymentStatus.Settled;
        debt.SettledAt = clock.UtcNow();
        await database.SaveChangesAsync(ct);

        return Result<DebtDetails>.Success(ToDetails(debt));
    }

    public async Task<Result<DebtDetails>> CreateAdHocAsync(
        CreateAdHocDebtCommand command,
        CancellationToken ct
    )
    {
        var creditorExists = await database.Users.AnyAsync(
            user => user.Id == command.CreditorUserId && user.IsActive,
            ct
        );
        if (!creditorExists)
            return Result<DebtDetails>.NotFound("Empfänger nicht gefunden.");

        var debt = new Debt
        {
            Id = Guid.NewGuid(),
            DebtorUserId = command.CallerUserId,
            CreditorUserId = command.CreditorUserId,
            OrderId = null,
            OrderDayId = null,
            AmountCents = command.AmountCents,
            Reason = command.Reason,
            Status = PaymentStatus.Open,
            CreatedAt = clock.UtcNow(),
            SettledAt = null,
        };
        database.Debts.Add(debt);
        await database.SaveChangesAsync(ct);

        return Result<DebtDetails>.Success(ToDetails(debt));
    }

    private async Task<IReadOnlyList<Debt>> LoadOpenDebts(
        System.Linq.Expressions.Expression<Func<Debt, bool>> sideFilter,
        CancellationToken ct
    )
    {
        // SQLite cannot ORDER BY a DateTimeOffset, so order in memory (newest first).
        var debts = await database
            .Debts.AsNoTracking()
            .Include(debt => debt.DebtorUser)
            .Include(debt => debt.CreditorUser)
            .Include(debt => debt.OrderDay)
            .Where(debt => debt.Status == PaymentStatus.Open)
            .Where(sideFilter)
            .ToListAsync(ct);

        return debts.OrderByDescending(debt => debt.CreatedAt).ToList();
    }

    private DebtSummary MapRow(Debt debt, User? otherParty)
    {
        var name = otherParty?.DisplayName ?? string.Empty;
        var handle = otherParty?.PayPalHandle;
        var dayLabel = debt.OrderDay is null
            ? null
            : DebtDayLabelBuilder.Build(debt.OrderDay.Date, clock.Today());

        return new DebtSummary(
            debt.Id,
            name,
            NameFormatter.InitialsOf(name),
            otherParty?.AvatarColorHex ?? string.Empty,
            debt.Reason,
            dayLabel,
            debt.AmountCents,
            MoneyFormatter.ToGermanString(debt.AmountCents),
            PayPalLinkBuilder.BuildLink(handle, debt.AmountCents),
            debt.CreatedAt
        );
    }

    private static DebtHistorySummary MapHistoryRow(Debt debt, User? creditor)
    {
        var name = creditor?.DisplayName ?? string.Empty;

        return new DebtHistorySummary(
            name,
            NameFormatter.InitialsOf(name),
            creditor?.AvatarColorHex ?? string.Empty,
            debt.AmountCents,
            MoneyFormatter.ToGermanString(debt.AmountCents),
            debt.SettledAt ?? debt.CreatedAt,
            debt.Reason
        );
    }

    private static DebtLedgerDetails BuildLedger(IReadOnlyList<DebtSummary> rows)
    {
        var total = rows.Sum(row => row.AmountCents);
        return new DebtLedgerDetails(rows.Count, total, MoneyFormatter.ToGermanString(total), rows);
    }

    private static DebtDetails ToDetails(Debt debt) =>
        new(debt.Id, debt.Status.ToString(), debt.SettledAt, debt.AmountCents, debt.Reason);
}
