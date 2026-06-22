using System.Globalization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Schulz.DoenerControl.Application.Dashboard;
using Schulz.DoenerControl.Application.Debts;
using Schulz.DoenerControl.Application.Leaderboards;
using Schulz.DoenerControl.Application.Menu;
using Schulz.DoenerControl.Application.Notifications;
using Schulz.DoenerControl.Application.OrderDays;
using Schulz.DoenerControl.Application.Orders;
using Schulz.DoenerControl.Application.Profile;
using Schulz.DoenerControl.Application.Push;
using Schulz.DoenerControl.Application.Security;
using Schulz.DoenerControl.Application.Tiers;
using Schulz.DoenerControl.Application.Users;
using Schulz.DoenerControl.Infrastructure.Dashboard;
using Schulz.DoenerControl.Infrastructure.Debts;
using Schulz.DoenerControl.Infrastructure.Leaderboards;
using Schulz.DoenerControl.Infrastructure.Menu;
using Schulz.DoenerControl.Infrastructure.Notifications;
using Schulz.DoenerControl.Infrastructure.OrderDays;
using Schulz.DoenerControl.Infrastructure.Orders;
using Schulz.DoenerControl.Infrastructure.Persistence;
using Schulz.DoenerControl.Infrastructure.Persistence.Seeding;
using Schulz.DoenerControl.Infrastructure.Profile;
using Schulz.DoenerControl.Infrastructure.Push;
using Schulz.DoenerControl.Infrastructure.Security;
using Schulz.DoenerControl.Infrastructure.Tiers;
using Schulz.DoenerControl.Infrastructure.Users;

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
            options
                .UseSqlite(configuration.GetConnectionString(AppDbConnectionName))
                .AddInterceptors(new SqliteBusyTimeoutInterceptor())
        );
        services.TryAddSingletonTimeProvider();
        services.AddPasswordHashing(configuration);
        services.AddSingleton<ILoginLockout, LoginLockout>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IProfileService, ProfileService>();
        services.AddScoped<IMenuService, MenuService>();
        services.AddPush(configuration);
        services.AddOrderDays(configuration);
        services.AddScoped<IOrderService, OrderService>();
        services.AddScoped<IPickupService, PickupService>();
        services.AddScoped<IDebtService, DebtService>();
        services.AddScoped<ILeaderboardService, LeaderboardService>();
        services.AddScoped<ITierService, TierService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddAdminSeed(configuration);
        services.AddScoped<MenuSeeder>();
        services.AddScoped<DatabaseSeeder>();
        services.AddScoped<DevHistorySeeder>();
        return services;
    }

    private static void AddAdminSeed(this IServiceCollection services, IConfiguration configuration)
    {
        services
            .AddOptions<AdminSeedOptions>()
            .Configure(options => BindAdminSeed(configuration, options));
    }

    private static void BindAdminSeed(IConfiguration configuration, AdminSeedOptions options)
    {
        var section = configuration.GetSection(AdminSeedOptions.ConfigSection);

        var username = section["Username"];
        if (!string.IsNullOrWhiteSpace(username))
        {
            options.Username = username;
        }

        options.Password = section["Password"] ?? string.Empty;

        var displayName = section["DisplayName"];
        if (!string.IsNullOrWhiteSpace(displayName))
        {
            options.DisplayName = displayName;
        }

        var avatarColorHex = section["AvatarColorHex"];
        if (!string.IsNullOrWhiteSpace(avatarColorHex))
        {
            options.AvatarColorHex = avatarColorHex;
        }
    }

    private static void AddPush(this IServiceCollection services, IConfiguration configuration)
    {
        services
            .AddOptions<VapidOptions>()
            .Configure(options => BindVapidOptions(configuration, options));

        // The real transport is a singleton (it owns one HttpClient via WebPushClient); the
        // subscription store and the broadcaster are scoped because they use the request DbContext.
        services.AddSingleton<IWebPushTransport, WebPushTransport>();
        services.AddSingleton<IPushKeyService, PushKeyService>();
        services.AddScoped<IPushSubscriptionService, PushSubscriptionService>();
        services.AddScoped<IPushBroadcaster, PushBroadcaster>();
    }

    private static void BindVapidOptions(IConfiguration configuration, VapidOptions options)
    {
        options.Subject = configuration[VapidOptions.SubjectConfigKey] ?? string.Empty;
        options.PublicKey = configuration[VapidOptions.PublicKeyConfigKey] ?? string.Empty;
        options.PrivateKey = configuration[VapidOptions.PrivateKeyConfigKey] ?? string.Empty;
    }

    private static void AddOrderDays(this IServiceCollection services, IConfiguration configuration)
    {
        services
            .AddOptions<OrderDayOptions>()
            .Configure(options => BindOrderDayOptions(configuration, options));

        services.AddScoped<OrderDayClock>();
        services.AddScoped<INotificationBroadcaster, NotificationBroadcaster>();
        services.AddScoped<CloseDayDebtGenerator>();
        services.AddScoped<IOrderDayService, OrderDayService>();
    }

    private static void BindOrderDayOptions(IConfiguration configuration, OrderDayOptions options)
    {
        var cutoff = configuration[OrderDayOptions.CutoffConfigKey];
        if (
            !string.IsNullOrWhiteSpace(cutoff)
            && TimeOnly.TryParse(cutoff, CultureInfo.InvariantCulture, out var parsed)
        )
        {
            options.CutoffLocalTime = parsed;
        }

        var timeZoneId = configuration[OrderDayOptions.TimeZoneConfigKey];
        if (!string.IsNullOrWhiteSpace(timeZoneId))
        {
            options.TimeZoneId = timeZoneId;
        }
    }

    private static void AddPasswordHashing(
        this IServiceCollection services,
        IConfiguration configuration
    )
    {
        services
            .AddOptions<PasswordHashingOptions>()
            .Configure(options => BindPasswordHashing(configuration, options))
            .Validate(
                options => !string.IsNullOrWhiteSpace(options.Pepper),
                $"'{PasswordHashingOptions.PepperConfigKey}' must be configured with a non-empty "
                    + "server-side pepper."
            )
            .Validate(
                options => options.MemorySize >= 8192,
                $"'{PasswordHashingOptions.ParametersConfigSection}:MemorySize' must be at least 8192."
            )
            .Validate(
                options => options.Iterations >= 1,
                $"'{PasswordHashingOptions.ParametersConfigSection}:Iterations' must be at least 1."
            )
            .ValidateOnStart();

        services.AddSingleton<IPasswordHasher, Argon2idPasswordHasher>();
    }

    private static void BindPasswordHashing(
        IConfiguration configuration,
        PasswordHashingOptions options
    )
    {
        options.Pepper = configuration[PasswordHashingOptions.PepperConfigKey] ?? string.Empty;

        var parameters = configuration.GetSection(PasswordHashingOptions.ParametersConfigSection);
        if (int.TryParse(parameters["MemorySize"], out var memorySize))
        {
            options.MemorySize = memorySize;
        }

        if (int.TryParse(parameters["Iterations"], out var iterations))
        {
            options.Iterations = iterations;
        }
    }

    // Applies the real migrations without running the user seed. The integration-test harness uses
    // this so it can apply the schema (and the HasData menu rows) and then seed its own explicit test
    // accounts, decoupled from the production bootstrap-admin seed.
    public static async Task MigrateAsync(
        this IServiceProvider services,
        CancellationToken ct = default
    )
    {
        using var scope = services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await database.Database.MigrateAsync(ct);
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
