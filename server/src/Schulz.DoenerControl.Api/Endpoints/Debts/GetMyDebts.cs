using FastEndpoints;
using Schulz.DoenerControl.Application.Debts;
using Schulz.DoenerControl.Application.Security;

namespace Schulz.DoenerControl.Api.Endpoints.Debts;

public sealed record GetMyDebtsResponse(
    int OpenCount,
    int TotalCents,
    string TotalLabel,
    IReadOnlyList<DebtSummaryDto> Debts
);

// The dashboard "Offene Zahlungen" card: the caller's open debts (what they owe), each with the
// creditor's name/initials/color and a server-built PayPal deep link. Authenticated.
public sealed class GetMyDebts : EndpointWithoutRequest<GetMyDebtsResponse>
{
    private readonly IDebtService debtService;
    private readonly ICurrentUser currentUser;

    public GetMyDebts(IDebtService debtService, ICurrentUser currentUser)
    {
        this.debtService = debtService;
        this.currentUser = currentUser;
    }

    public override void Configure()
    {
        Get("/api/debts/mine");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        if (currentUser.UserId is not { } callerId)
        {
            await Send.UnauthorizedAsync(ct);
            return;
        }

        var result = await debtService.GetOpenForDebtorAsync(callerId, ct);
        if (!result.IsSuccess)
        {
            await Send.ErrorsAsync(cancellation: ct);
            return;
        }

        var ledger = result.Value;
        var response = new GetMyDebtsResponse(
            ledger.OpenCount,
            ledger.TotalCents,
            ledger.TotalLabel,
            ledger.Debts.Select(DebtMapper.ToRowDto).ToList()
        );
        await Send.OkAsync(response, cancellation: ct);
    }
}
