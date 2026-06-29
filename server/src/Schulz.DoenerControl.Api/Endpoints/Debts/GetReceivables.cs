using FastEndpoints;
using Schulz.DoenerControl.Application.Debts;
using Schulz.DoenerControl.Application.Security;

namespace Schulz.DoenerControl.Api.Endpoints.Debts;

// Endpoint-layer projection of one creditor-side ledger row. DebtorName/Initials/AvatarColorHex
// describe the colleague who owes the caller. IsSettled/SettledAt reflect the debtor's self-attested
// settle. Mapped from the Application ReceivableSummary so the service type never leaks.
public sealed record ReceivableRowDto(
    Guid Id,
    string DebtorName,
    string Initials,
    string AvatarColorHex,
    string Reason,
    string? DayLabel,
    int AmountCents,
    string AmountLabel,
    bool IsSettled,
    DateTimeOffset? SettledAt
);

public sealed record GetReceivablesResponse(
    int OpenCount,
    int OpenTotalCents,
    string OpenTotalLabel,
    int SettledCount,
    int SettledTotalCents,
    string SettledTotalLabel,
    IReadOnlyList<ReceivableRowDto> Rows
);

// The Abholer's "Was mir noch zusteht" view: every debt where the caller is the creditor, across all
// days, split into open (still owed) and settled (already paid back) with their totals. Read-only —
// settling stays the debtor's self-attestation on their own "Offene Zahlungen" list. Authenticated.
public sealed class GetReceivables : EndpointWithoutRequest<GetReceivablesResponse>
{
    private readonly IDebtService debtService;
    private readonly ICurrentUser currentUser;

    public GetReceivables(IDebtService debtService, ICurrentUser currentUser)
    {
        this.debtService = debtService;
        this.currentUser = currentUser;
    }

    public override void Configure()
    {
        Get("/api/debts/receivables");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        if (currentUser.UserId is not { } callerId)
        {
            await Send.UnauthorizedAsync(ct);
            return;
        }

        var result = await debtService.GetReceivablesForCreditorAsync(callerId, ct);
        if (!result.IsSuccess)
        {
            await Send.ErrorsAsync(cancellation: ct);
            return;
        }

        var ledger = result.Value;
        var response = new GetReceivablesResponse(
            ledger.OpenCount,
            ledger.OpenTotalCents,
            ledger.OpenTotalLabel,
            ledger.SettledCount,
            ledger.SettledTotalCents,
            ledger.SettledTotalLabel,
            ledger.Rows.Select(ToRowDto).ToList()
        );
        await Send.OkAsync(response, cancellation: ct);
    }

    private static ReceivableRowDto ToRowDto(ReceivableSummary row) =>
        new(
            row.Id,
            row.DebtorName,
            row.Initials,
            row.AvatarColorHex,
            row.Reason,
            row.DayLabel,
            row.AmountCents,
            row.AmountLabel,
            row.IsSettled,
            row.SettledAt
        );
}
