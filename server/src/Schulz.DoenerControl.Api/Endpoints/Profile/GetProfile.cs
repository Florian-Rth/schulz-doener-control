using FastEndpoints;
using Schulz.DoenerControl.Application.Profile;
using Schulz.DoenerControl.Application.Security;

namespace Schulz.DoenerControl.Api.Endpoints.Profile;

public sealed record GetProfileResponse(
    Guid UserId,
    string DisplayName,
    string FirstName,
    string Initials,
    string AvatarColorHex,
    string Role,
    string? PayPalHandle,
    bool PayPalHandleSet
);

// Returns the caller's own profile: the self-entered PayPal.Me handle plus the read-only display
// fields. FirstName and Initials are derived from DisplayName, never stored. Authenticated.
public sealed class GetProfile : EndpointWithoutRequest<GetProfileResponse>
{
    private readonly IProfileService profileService;
    private readonly ICurrentUser currentUser;

    public GetProfile(IProfileService profileService, ICurrentUser currentUser)
    {
        this.profileService = profileService;
        this.currentUser = currentUser;
    }

    public override void Configure()
    {
        Get("/api/profile");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        if (currentUser.UserId is not { } callerId)
        {
            await Send.UnauthorizedAsync(ct);
            return;
        }

        var result = await profileService.GetAsync(callerId, ct);
        if (!result.IsSuccess)
        {
            await Send.NotFoundAsync(ct);
            return;
        }

        await Send.OkAsync(MapToResponse(result.Value), cancellation: ct);
    }

    private static GetProfileResponse MapToResponse(ProfileDetails details) =>
        new(
            details.UserId,
            details.DisplayName,
            details.FirstName,
            details.Initials,
            details.AvatarColorHex,
            details.Role.ToString(),
            details.PayPalHandle,
            details.PayPalHandleSet
        );
}
