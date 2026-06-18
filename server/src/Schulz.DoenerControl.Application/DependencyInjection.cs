using Microsoft.Extensions.DependencyInjection;
using Schulz.DoenerControl.Application.Health;

namespace Schulz.DoenerControl.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IHealthService, HealthService>();
        return services;
    }
}
