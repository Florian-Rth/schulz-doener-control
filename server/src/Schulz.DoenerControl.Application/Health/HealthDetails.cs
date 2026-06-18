namespace Schulz.DoenerControl.Application.Health;

public sealed record HealthDetails(string Status, string Version, DateTimeOffset CheckedAt);
