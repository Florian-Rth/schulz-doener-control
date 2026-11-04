using FastEndpoints;
using FluentValidation;
using Schulz.DoenerControl.Application.Debts;
using Schulz.DoenerControl.Application.Security;

namespace Schulz.DoenerControl.Api.Endpoints.Debts;

public sealed class GetDebtHistoryRequest
{
    [QueryParam]
    public int Skip { get; set; }

    [QueryParam]
    public int Take { get; set; } = GetDebtHistoryRequestValidator.DefaultTake;
}

public sealed record GetDebtHistoryResponse(IReadOnlyList<DebtHistoryDto> Payments, bool HasMore);

public sealed class GetDebtHistoryRequestValidator : Validator<GetDebtHistoryRequest>
{
    private const int MaxTake = 50;
    public const int DefaultTake = 10;

    public GetDebtHistoryRequestValidator()
    {
        RuleFor(request => request.Skip).GreaterThanOrEqualTo(0);
        RuleFor(request => request.Take).InclusiveBetween(1, MaxTake);
    }
}

// The "Meine letzten Zahlungen" history: the caller's settled debts (what they paid), each row
// describing the creditor they paid. Newest-settled first, paged via ?skip=&take= (default: the
// last 10) with HasMore telling the card whether "Mehr anzeigen" can load older ones.
// Authenticated.
public sealed class GetDebtHistory : Endpoint<GetDebtHistoryRequest, GetDebtHistoryResponse>
{
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

    public override async Task HandleAsync(GetDebtHistoryRequest req, CancellationToken ct)
    {
        if (currentUser.UserId is not { } callerId)
        {
            await Send.UnauthorizedAsync(ct);
            return;
        }

        var result = await debtService.GetSettledForDebtorAsync(
            new GetPaymentHistoryQuery(callerId, req.Skip, req.Take),
            ct
        );
        if (!result.IsSuccess)
        {
            await Send.ErrorsAsync(cancellation: ct);
            return;
        }

        await Send.OkAsync(MapToResponse(result.Value), cancellation: ct);
    }

    private static GetDebtHistoryResponse MapToResponse(DebtHistoryPage page) =>
        new(page.Payments.Select(DebtMapper.ToHistoryDto).ToList(), page.HasMore);
}
