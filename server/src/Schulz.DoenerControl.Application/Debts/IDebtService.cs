using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Application.Debts;

public interface IDebtService
{
    // What the caller owes (caller = debtor). Only Status=Open. Rows describe the creditor.
    Task<Result<DebtLedgerDetails>> GetOpenForDebtorAsync(Guid callerId, CancellationToken ct);

    // What is owed to the caller (caller = creditor). Only Status=Open. Rows describe the debtor.
    Task<Result<DebtLedgerDetails>> GetForCreditorAsync(Guid callerId, CancellationToken ct);

    // The caller's full creditor-side ledger (caller = creditor): open AND settled, split with their
    // totals. Open rows first (newest-created), then settled (newest-settled). Read-only.
    Task<Result<ReceivablesLedgerDetails>> GetReceivablesForCreditorAsync(
        Guid callerId,
        CancellationToken ct
    );

    // The caller's recent payments (caller = debtor). Only Status=Settled, newest-settled first,
    // capped at the last `take`. Rows describe the creditor (the colleague the caller paid).
    Task<Result<IReadOnlyList<DebtHistorySummary>>> GetSettledForDebtorAsync(
        Guid callerId,
        int take,
        CancellationToken ct
    );

    Task<Result<DebtDetails>> SettleAsync(SettleDebtCommand command, CancellationToken ct);

    Task<Result<DebtDetails>> CreateAdHocAsync(
        CreateAdHocDebtCommand command,
        CancellationToken ct
    );
}
