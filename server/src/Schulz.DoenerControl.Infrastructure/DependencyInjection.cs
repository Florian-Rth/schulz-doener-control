using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Schulz.DoenerControl.Infrastructure.Persistence;
using Schulz.DoenerControl.Infrastructure.Persistence.Seeding;

namespace Schulz.DoenerControl.Infrastructure;

public static class DependencyInjection
{
    private const string AppDbConnectionName = "AppDb";

    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration
    )
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlite(configuration.GetConnectionString(AppDbConnectionName))
        );
        services.TryAddSingletonTimeProvider();
        services.AddScoped<DatabaseSeeder>();
        services.AddScoped<DevHistorySeeder>();
        return services;
    }

    public static async Task MigrateAndSeedAsync(
        this IServiceProvider services,
        bool seedDevHistory = false,
        CancellationToken ct = default
    )
    {
        using var scope = services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await database.Database.MigrateAsync(ct);

        var seeder = scope.ServiceProvider.GetRequiredService<DatabaseSeeder>();
        await seeder.SeedAsync(ct);

        if (seedDevHistory)
        {
            var historySeeder = scope.ServiceProvider.GetRequiredService<DevHistorySeeder>();
            await historySeeder.SeedAsync(ct);
        }
    }

    private static void TryAddSingletonTimeProvider(this IServiceCollection services)
    {
        if (services.All(descriptor => descriptor.ServiceType != typeof(TimeProvider)))
        {
            services.AddSingleton(TimeProvider.System);
        }
    }
}
