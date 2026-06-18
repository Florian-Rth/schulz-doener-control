using FastEndpoints;
using FluentValidation;
using Schulz.DoenerControl.Application.Debts;
using Schulz.DoenerControl.Application.Security;
using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Api.Endpoints.Debts;

public sealed class SettleDebtRequest
{
    [RouteParam]
    public Guid Id { get; set; }
}

public sealed record SettleDebtResponse(DebtDetailsDto Debt);

public sealed class SettleDebtRequestValidator : Validator<SettleDebtRequest>
{
    public SettleDebtRequestValidator()
    {
        RuleFor(request => request.Id).NotEmpty();
    }
}

// Marks a debt paid (off-platform PayPal settlement → in-app confirm). The caller must be the debtor
// or the creditor of the debt (else 404, so existence is not leaked); an already-settled debt is a
// 409 conflict. Authenticated.
public sealed class SettleDebt : Endpoint<SettleDebtRequest, SettleDebtResponse>
{
    private readonly IDebtService debtService;
    private readonly ICurrentUser currentUser;

    public SettleDebt(IDebtService debtService, ICurrentUser currentUser)
    {
        this.debtService = debtService;
        this.currentUser = currentUser;
    }

    public override void Configure()
    {
        Post("/api/debts/{Id}/settle");
    }

    public override async Task HandleAsync(SettleDebtRequest req, CancellationToken ct)
    {
        if (currentUser.UserId is not { } callerId)
        {
            await Send.UnauthorizedAsync(ct);
            return;
        }

        var result = await debtService.SettleAsync(new SettleDebtCommand(callerId, req.Id), ct);
        if (!result.IsSuccess)
        {
            await SendFailureAsync(result.Status, ct);
            return;
        }

        await Send.OkAsync(
            new SettleDebtResponse(DebtMapper.ToDetailsDto(result.Value)),
            cancellation: ct
        );
    }

    private async Task SendFailureAsync(ResultStatus status, CancellationToken ct)
    {
        switch (status)
        {
            case ResultStatus.NotFound:
                await Send.NotFoundAsync(ct);
                break;
            case ResultStatus.Conflict:
                await Send.ErrorsAsync(StatusCodes.Status409Conflict, cancellation: ct);
                break;
            default:
                await Send.ErrorsAsync(cancellation: ct);
                break;
        }
    }
}
