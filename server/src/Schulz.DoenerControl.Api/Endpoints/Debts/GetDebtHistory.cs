using FastEndpoints;
using Schulz.DoenerControl.Application.Debts;
using Schulz.DoenerControl.Application.Security;

namespace Schulz.DoenerControl.Api.Endpoints.Debts;

public sealed record GetDebtHistoryResponse(IReadOnlyList<DebtHistoryDto> Payments);

// The "Meine letzten Zahlungen" history: the caller's most recently settled debts (what they paid),
// each row describing the creditor they paid. Newest-settled first, capped at the last 10.
// Authenticated.
public sealed class GetDebtHistory : EndpointWithoutRequest<GetDebtHistoryResponse>
{
    private const int HistoryTake = 10;

    private readonly IDebtService debtService;
    private readonly ICurrentUser currentUser;

    public GetDebtHistory(IDebtService debtService, ICurrentUser currentUser)
    {
        this.debtService = debtService;
        this.currentUser = currentUser;
    }

    public override void Configure()
    {
        Get("/api/debts/history");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        if (currentUser.UserId is not { } callerId)
        {
            await Send.UnauthorizedAsync(ct);
            return;
        }

        var result = await debtService.GetSettledForDebtorAsync(callerId, HistoryTake, ct);
        if (!result.IsSuccess)
        {
            await Send.ErrorsAsync(cancellation: ct);
            return;
        }

        var response = new GetDebtHistoryResponse(
            result.Value.Select(DebtMapper.ToHistoryDto).ToList()
        );
        await Send.OkAsync(response, cancellation: ct);
    }
}
