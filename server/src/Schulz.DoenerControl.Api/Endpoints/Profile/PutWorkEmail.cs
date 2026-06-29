using FastEndpoints;
using FluentValidation;
using Schulz.DoenerControl.Application.Profile;
using Schulz.DoenerControl.Application.Security;
using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Api.Endpoints.Profile;

public sealed record PutWorkEmailRequest(string? WorkEmail);

public sealed record PutWorkEmailResponse(string? WorkEmail, bool WorkEmailSet);

public sealed class PutWorkEmailRequestValidator : Validator<PutWorkEmailRequest>
{
    public PutWorkEmailRequestValidator()
    {
        // A null or blank value clears it; the email rule applies only to a real value.
        When(
            request => !string.IsNullOrWhiteSpace(request.WorkEmail),
            () =>
                RuleFor(request => request.WorkEmail)
                    .MaximumLength(256)
                    .EmailAddress()
                    .WithMessage("Bitte gib eine gültige E-Mail-Adresse ein, Chef.")
        );
    }
}

// Captures, updates, or clears the caller's optional work email — the address the order-list PDF is
// sent to when the office printer is out of reach. A null or blank value clears it. Authenticated.
public sealed class PutWorkEmail : Endpoint<PutWorkEmailRequest, PutWorkEmailResponse>
{
    private readonly IProfileService profileService;
    private readonly ICurrentUser currentUser;

    public PutWorkEmail(IProfileService profileService, ICurrentUser currentUser)
    {
        this.profileService = profileService;
        this.currentUser = currentUser;
    }

    public override void Configure()
    {
        Put("/api/profile/work-email");
    }

    public override async Task HandleAsync(PutWorkEmailRequest req, CancellationToken ct)
    {
        if (currentUser.UserId is not { } callerId)
        {
            await Send.UnauthorizedAsync(ct);
            return;
        }

        var command = new UpdateWorkEmailCommand(callerId, req.WorkEmail);
        var result = await profileService.UpdateWorkEmailAsync(command, ct);

        if (!result.IsSuccess)
        {
            await SendFailureAsync(result.Status, ct);
            return;
        }

        var details = result.Value;
        await Send.OkAsync(
            new PutWorkEmailResponse(details.WorkEmail, details.WorkEmailSet),
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
            default:
                await Send.ErrorsAsync(cancellation: ct);
                break;
        }
    }
}
