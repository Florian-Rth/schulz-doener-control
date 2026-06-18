namespace Schulz.DoenerControl.Application.Security;

// Logout revokes the presented refresh token's whole family (here: all of the caller's refresh
// tokens, since the schema carries no family id) so no rotation chain survives the sign-out.
public sealed record LogoutCommand(Guid CallerUserId, string? RawRefreshToken);
