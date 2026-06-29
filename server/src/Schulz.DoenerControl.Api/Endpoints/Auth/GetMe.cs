using FastEndpoints;
using Schulz.DoenerControl.Api.Auth;
using Schulz.DoenerControl.Application.Security;
using Schulz.DoenerControl.Application.Users;

namespace Schulz.DoenerControl.Api.Endpoints.Auth;

public sealed record GetMeResponse(
    Guid UserId,
    string DisplayName,
    string FirstName,
    string Initials,
    string AvatarColorHex,
    string Role,
    bool PayPalHandleSet,
    string? PayPalHandle,
    string? WorkEmail,
    bool MustChangePassword
);

// Hydrates the SPA after a reload or silent refresh and reissues the CSRF token so the client always
// holds a current double-submit token before its next mutation. Authenticated.
public sealed class GetMe : EndpointWithoutRequest<GetMeResponse>
{
    private readonly IUserService userService;
    private readonly ICurrentUser currentUser;
    private readonly AuthSessionWriter sessionWriter;

    public GetMe(
        IUserService userService,
        ICurrentUser currentUser,
        AuthSessionWriter sessionWriter
    )
    {
        this.userService = userService;
        this.currentUser = currentUser;
        this.sessionWriter = sessionWriter;
    }

    public override void Configure()
    {
        Get("/api/auth/me");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        if (currentUser.UserId is not { } callerId)
        {
            await Send.UnauthorizedAsync(ct);
            return;
        }

        var result = await userService.GetMeAsync(callerId, ct);
        if (!result.IsSuccess)
        {
            await Send.NotFoundAsync(ct);
            return;
        }

        sessionWriter.ReissueXsrf(HttpContext.Response);
        await Send.OkAsync(MapToResponse(result.Value), cancellation: ct);
    }

    private static GetMeResponse MapToResponse(CurrentUserDetails details) =>
        new(
            details.UserId,
            details.DisplayName,
            details.FirstName,
            details.Initials,
            details.AvatarColorHex,
            details.Role.ToString(),
            details.PayPalHandleSet,
            details.PayPalHandle,
            details.WorkEmail,
            details.MustChangePassword
        );
}
