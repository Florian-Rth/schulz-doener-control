namespace Schulz.DoenerControl.Application.Users;

// The result of a successful self-registration. Carries no credential: the colleague already knows
// the password they chose and logs in with it afterward.
public sealed record RegisteredUserDetails(Guid UserId, string Username, string DisplayName);
