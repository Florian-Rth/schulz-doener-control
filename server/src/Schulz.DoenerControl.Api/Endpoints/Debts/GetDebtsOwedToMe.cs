using FastEndpoints;
using Schulz.DoenerControl.Application.Debts;
using Schulz.DoenerControl.Application.Security;

namespace Schulz.DoenerControl.Api.Endpoints.Debts;

public sealed record GetDebtsOwedToMeResponse(
    int OpenCount,
    int TotalCents,
    string TotalLabel,
    IReadOnlyList<DebtSummaryDto> Debts
);

// The Abholer's "you collect X from N colleagues" view: open debts where the caller is the creditor,
// each row describing the debtor. Authenticated.
public sealed class GetDebtsOwedToMe : EndpointWithoutRequest<GetDebtsOwedToMeResponse>
{
    private readonly IDebtService debtService;
    private readonly ICurrentUser currentUser;

    public GetDebtsOwedToMe(IDebtService debtService, ICurrentUser currentUser)
    {
        this.debtService = debtService;
        this.currentUser = currentUser;
    }

    public override void Configure()
    {
        Get("/api/debts/owed-to-me");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        if (currentUser.UserId is not { } callerId)
        {
            await Send.UnauthorizedAsync(ct);
            return;
        }

        var result = await debtService.GetForCreditorAsync(callerId, ct);
        if (!result.IsSuccess)
        {
            await Send.ErrorsAsync(cancellation: ct);
            return;
        }

        var ledger = result.Value;
        var response = new GetDebtsOwedToMeResponse(
            ledger.OpenCount,
            ledger.TotalCents,
            ledger.TotalLabel,
            ledger.Debts.Select(DebtMapper.ToRowDto).ToList()
        );
        await Send.OkAsync(response, cancellation: ct);
    }
}
