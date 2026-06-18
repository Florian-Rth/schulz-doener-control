using System.Text.RegularExpressions;
using FastEndpoints;
using FluentValidation;
using Schulz.DoenerControl.Application.Profile;
using Schulz.DoenerControl.Application.Security;
using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Api.Endpoints.Profile;

public sealed record PutPayPalHandleRequest(string? PayPalHandle);

public sealed record PutPayPalHandleResponse(string? PayPalHandle, bool PayPalHandleSet);

public sealed partial class PutPayPalHandleRequestValidator : Validator<PutPayPalHandleRequest>
{
    // PayPal.Me handle charset: letters and digits only, so the
    // https://paypal.me/{handle}/{amount}EUR link stays valid (no spaces/slashes).
    [GeneratedRegex("^[A-Za-z0-9]+$")]
    private static partial Regex HandlePattern();

    public PutPayPalHandleRequestValidator()
    {
        // A null or blank handle clears it; the charset/length rules apply only to a real value.
        When(
            request => !string.IsNullOrWhiteSpace(request.PayPalHandle),
            () =>
                RuleFor(request => request.PayPalHandle)
                    .MaximumLength(40)
                    .Must(handle => HandlePattern().IsMatch(handle!))
                    .WithMessage("Der PayPal-Name darf nur Buchstaben und Ziffern enthalten.")
        );
    }
}

// Captures, updates, or clears the caller's PayPal.Me handle (the product gap that drives every
// payment link). A null or blank handle clears it. Authenticated.
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
