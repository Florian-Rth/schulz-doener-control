using FastEndpoints;
using FluentValidation;
using Schulz.DoenerControl.Application.Debts;
using Schulz.DoenerControl.Application.Security;
using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Api.Endpoints.Debts;

public sealed class PostDebtRequest
{
    public Guid CreditorUserId { get; set; }

    public int AmountCents { get; set; }

    public string Reason { get; set; } = string.Empty;
}

public sealed record PostDebtResponse(DebtDetailsDto Debt);

public sealed class PostDebtRequestValidator : Validator<PostDebtRequest>
{
    public PostDebtRequestValidator()
    {
        RuleFor(request => request.CreditorUserId).NotEmpty();
        RuleFor(request => request.AmountCents).InclusiveBetween(1, 100000);
        RuleFor(request => request.Reason).NotEmpty().MaximumLength(80);
    }
}

// Creates an ad-hoc debt not tied to an order (the mock's "Ayran-Schulden"): the caller is the
// debtor and owes CreditorUserId the amount. The creditor cannot be the caller and must be an active
// user (else 404). Authenticated.
public sealed class PostDebt : Endpoint<PostDebtRequest, PostDebtResponse>
{
    private readonly IDebtService debtService;
    private readonly ICurrentUser currentUser;

    public PostDebt(IDebtService debtService, ICurrentUser currentUser)
    {
        this.debtService = debtService;
        this.currentUser = currentUser;
    }

    public override void Configure()
    {
        Post("/api/debts");
    }

    public override async Task HandleAsync(PostDebtRequest req, CancellationToken ct)
    {
        if (currentUser.UserId is not { } callerId)
        {
            await Send.UnauthorizedAsync(ct);
            return;
        }

        if (req.CreditorUserId == callerId)
        {
            AddError(
                request => request.CreditorUserId,
                "Man kann sich nicht selbst Geld schulden."
            );
            await Send.ErrorsAsync(cancellation: ct);
            return;
        }

        var command = new CreateAdHocDebtCommand(
            callerId,
            req.CreditorUserId,
            req.AmountCents,
            req.Reason
        );
        var result = await debtService.CreateAdHocAsync(command, ct);
        if (!result.IsSuccess)
        {
            await SendFailureAsync(result.Status, ct);
            return;
        }

        await Send.OkAsync(
            new PostDebtResponse(DebtMapper.ToDetailsDto(result.Value)),
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
