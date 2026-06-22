using FastEndpoints;
using FluentValidation;
using Schulz.DoenerControl.Application.Profile;
using Schulz.DoenerControl.Application.Security;
using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Api.Endpoints.Profile;

public sealed record PutDisplayNameRequest(string DisplayName);

public sealed record PutDisplayNameResponse(
    string DisplayName,
    string Initials,
    string AvatarColorHex
);

public sealed class PutDisplayNameRequestValidator : Validator<PutDisplayNameRequest>
{
    public PutDisplayNameRequestValidator()
    {
        RuleFor(request => request.DisplayName)
            .NotEmpty()
            .WithMessage("Der Anzeigename darf nicht leer sein.")
            .MaximumLength(128);
    }
}

// Self-service rename of the caller's own display name. The caller id comes from the JWT, never the
// body, so it can only ever change the caller's own name. Authenticated.
public sealed class PutDisplayName : Endpoint<PutDisplayNameRequest, PutDisplayNameResponse>
{
    private readonly IProfileService profileService;
    private readonly ICurrentUser currentUser;

    public PutDisplayName(IProfileService profileService, ICurrentUser currentUser)
    {
        this.profileService = profileService;
        this.currentUser = currentUser;
    }

    public override void Configure()
    {
        Put("/api/profile/display-name");
    }

    public override async Task HandleAsync(PutDisplayNameRequest req, CancellationToken ct)
    {
        if (currentUser.UserId is not { } callerId)
        {
            await Send.UnauthorizedAsync(ct);
            return;
        }

        var command = new UpdateDisplayNameCommand(callerId, req.DisplayName);
        var result = await profileService.UpdateDisplayNameAsync(command, ct);

        if (!result.IsSuccess)
        {
            await SendFailureAsync(result.Status, ct);
            return;
        }

        var details = result.Value;
        await Send.OkAsync(
            new PutDisplayNameResponse(
                details.DisplayName,
                details.Initials,
                details.AvatarColorHex
            ),
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
