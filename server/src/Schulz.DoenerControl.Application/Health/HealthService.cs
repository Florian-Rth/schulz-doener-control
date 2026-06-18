using System.Reflection;
using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Application.Health;

public sealed class HealthService : IHealthService
{
    private const string HealthyStatus = "Healthy";

    private static readonly string AssemblyVersion =
        typeof(HealthService).Assembly.GetName().Version?.ToString() ?? "0.0.0.0";

    public Result<HealthDetails> GetHealth()
    {
        var details = new HealthDetails(HealthyStatus, AssemblyVersion, DateTimeOffset.UtcNow);
        return Result<HealthDetails>.Success(details);
    }
}
