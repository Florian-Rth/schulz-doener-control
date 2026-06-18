using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Application.Debts;

public interface IDebtService
{
    // What the caller owes (caller = debtor). Only Status=Open. Rows describe the creditor.
    Task<Result<DebtLedgerDetails>> GetOpenForDebtorAsync(Guid callerId, CancellationToken ct);

    // What is owed to the caller (caller = creditor). Only Status=Open. Rows describe the debtor.
    Task<Result<DebtLedgerDetails>> GetForCreditorAsync(Guid callerId, CancellationToken ct);

    Task<Result<DebtDetails>> SettleAsync(SettleDebtCommand command, CancellationToken ct);

    Task<Result<DebtDetails>> CreateAdHocAsync(
        CreateAdHocDebtCommand command,
        CancellationToken ct
    );
}
