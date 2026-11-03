using FastEndpoints.Testing;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Schulz.DoenerControl.Infrastructure;
using Schulz.DoenerControl.Infrastructure.Persistence;

namespace Schulz.DoenerControl.Api.Tests.Config;

// A PWA-gate-enabled variant of the real-SQLite harness: same per-class isolated SQLite database,
// but with Auth:PwaGateEnabled configured true so /api/config reports the install gate as active.
[DisableWafCache]
public sealed class PwaGateEnabledApp : AppFixture<Program>, IResettableTestApp
{
    private readonly SqliteTestDatabase database = new("doener-pwagate-test");

    protected override void ConfigureApp(IWebHostBuilder builder)
    {
        database.Open();

        builder.UseEnvironment("Testing");

        builder.UseSetting("ConnectionStrings:AppDb", database.ConnectionString);
        builder.UseSetting("Auth:Pepper", TestConfig.Pepper);
        builder.UseSetting("Auth:JwtSigningKey", TestConfig.JwtSigningKey);
        builder.UseSetting("Auth:JwtIssuer", TestConfig.JwtIssuer);
        builder.UseSetting("Auth:JwtAudience", TestConfig.JwtAudience);
        builder.UseSetting("Auth:OrderCutoffLocalTime", TestConfig.OrderCutoffLocalTime);
        builder.UseSetting("Auth:PwaGateEnabled", "true");
        builder.UseSetting("PasswordHashing:MemorySize", TestConfig.PasswordHashingMemorySize);
        builder.UseSetting("PasswordHashing:Iterations", TestConfig.PasswordHashingIterations);
    }

    protected override void ConfigureServices(IServiceCollection services)
    {
        services.RemoveAll<DbContextOptions<AppDbContext>>();
        services.RemoveAll<AppDbContext>();
        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlite(database.ConnectionString)
        );

        TestClock.Override(services);
    }

    protected override async ValueTask SetupAsync()
    {
        await Services.MigrateAsync();
        await Services.SeedStandardTestUsersAsync();

        database.CaptureSnapshot();
    }

    protected override ValueTask TearDownAsync()
    {
        database.Dispose();
        return ValueTask.CompletedTask;
    }

    public void ResetDatabase()
    {
        database.RestoreSnapshot();
    }
}
