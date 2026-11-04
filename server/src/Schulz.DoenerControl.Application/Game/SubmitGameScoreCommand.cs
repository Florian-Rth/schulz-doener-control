namespace Schulz.DoenerControl.Application.Game;

// A finished Döner-Weitwurf round of the authenticated caller. The caller id comes from the JWT.
public sealed record SubmitGameScoreCommand(Guid CallerUserId, int Score, int Hits, int Misses);
