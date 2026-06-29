using FastEndpoints;
using FluentValidation;
using Schulz.DoenerControl.Application.Email;
using Schulz.DoenerControl.Application.Security;
using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Api.Endpoints.OrderDays;

public sealed class EmailOrderListPdfRequest
{
    [RouteParam]
    public Guid Id { get; set; }
}

public sealed record EmailOrderListPdfResponse(string SentToAddress);

public sealed class EmailOrderListPdfRequestValidator : Validator<EmailOrderListPdfRequest>
{
    public EmailOrderListPdfRequestValidator()
    {
        RuleFor(request => request.Id).NotEmpty();
    }
}

// Mails the running day's order list as a PDF to the caller's stored work email — for the Abholer who
// can't reach the office printer from a personal phone. Allowed for an admin OR the day's collector
// (authorized in the service). Disabled gracefully when SMTP is not configured (409). Authenticated.
public sealed class PostEmailOrderListPdf
    : Endpoint<EmailOrderListPdfRequest, EmailOrderListPdfResponse>
{
    private readonly IOrderListMailService mailService;
    private readonly ICurrentUser currentUser;

    public PostEmailOrderListPdf(IOrderListMailService mailService, ICurrentUser currentUser)
    {
        this.mailService = mailService;
        this.currentUser = currentUser;
    }

    public override void Configure()
    {
        Post("/api/order-days/{Id}/email-pdf");
    }

    public override async Task HandleAsync(EmailOrderListPdfRequest req, CancellationToken ct)
    {
        if (currentUser.UserId is not { } callerId)
        {
            await Send.UnauthorizedAsync(ct);
            return;
        }

        var result = await mailService.SendDayListToCallerAsync(
            callerId,
            User.IsInRole("Admin"),
            req.Id,
            ct
        );

        if (!result.IsSuccess)
        {
            if (result.Error is { } message)
            {
                AddError(message);
            }

            await SendFailureAsync(result.Status, ct);
            return;
        }

        await Send.OkAsync(new EmailOrderListPdfResponse(result.Value), cancellation: ct);
    }

    private async Task SendFailureAsync(ResultStatus status, CancellationToken ct)
    {
        switch (status)
        {
            case ResultStatus.NotFound:
                await Send.NotFoundAsync(ct);
                break;
            case ResultStatus.Forbidden:
                await Send.ForbiddenAsync(ct);
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
