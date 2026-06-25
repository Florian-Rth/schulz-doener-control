using FastEndpoints;
using FluentValidation;
using Schulz.DoenerControl.Api.Validation;
using Schulz.DoenerControl.Application.Profile;
using Schulz.DoenerControl.Application.Security;
using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Api.Endpoints.Profile;

public sealed record PutPayPalHandleRequest(string? PayPalHandle);

public sealed record PutPayPalHandleResponse(string? PayPalHandle, bool PayPalHandleSet);

public sealed class PutPayPalHandleRequestValidator : Validator<PutPayPalHandleRequest>
{
    public PutPayPalHandleRequestValidator()
    {
        // A null or blank link clears it; the URL rule applies only to a real value.
        When(
            request => !string.IsNullOrWhiteSpace(request.PayPalHandle),
            () => RuleFor(request => request.PayPalHandle).PayPalLink()
        );
    }
}

// Captures, updates, or clears the caller's full PayPal account link (the product gap that drives
// every payment button). A null or blank value clears it. Authenticated.
public sealed class PutPayPalHandle : Endpoint<PutPayPalHandleRequest, PutPayPalHandleResponse>
{
    private readonly IProfileService profileService;
    private readonly ICurrentUser currentUser;

    public PutPayPalHandle(IProfileService profileService, ICurrentUser currentUser)
    {
        this.profileService = profileService;
        this.currentUser = currentUser;
    }

    public override void Configure()
    {
        Put("/api/profile/paypal-handle");
    }

    public override async Task HandleAsync(PutPayPalHandleRequest req, CancellationToken ct)
    {
        if (currentUser.UserId is not { } callerId)
        {
            await Send.UnauthorizedAsync(ct);
            return;
        }

        var command = new UpdatePayPalHandleCommand(callerId, req.PayPalHandle);
        var result = await profileService.UpdatePayPalHandleAsync(command, ct);

        if (!result.IsSuccess)
        {
            await SendFailureAsync(result.Status, ct);
            return;
        }

        var details = result.Value;
        await Send.OkAsync(
            new PutPayPalHandleResponse(details.PayPalHandle, details.PayPalHandleSet),
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
