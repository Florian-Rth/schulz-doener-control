using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Application.Health;

public interface IHealthService
{
    Result<HealthDetails> GetHealth();
}
