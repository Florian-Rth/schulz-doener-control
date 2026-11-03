using FastEndpoints.Testing;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Schulz.DoenerControl.Application.Push;
using Schulz.DoenerControl.Infrastructure;
using Schulz.DoenerControl.Infrastructure.Persistence;

namespace Schulz.DoenerControl.Api.Tests.Push;

// A push-aware variant of the real-SQLite harness: same per-class isolated SQLite database, but the
// real Web Push HTTP transport is replaced by a recording double so send-on-open can be asserted.
[DisableWafCache]
public sealed class PushTestApp : AppFixture<Program>, IResettableTestApp
{
    private readonly SqliteTestDatabase database = new("doener-push-test");

    public RecordingWebPushTransport Transport { get; } = new();

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
        builder.UseSetting("PasswordHashing:MemorySize", TestConfig.PasswordHashingMemorySize);
        builder.UseSetting("PasswordHashing:Iterations", TestConfig.PasswordHashingIterations);

        // VAPID keys so the real transport's options bind/validate; the transport itself is doubled.
        builder.UseSetting("Push:VapidSubject", TestConfig.VapidSubject);
        builder.UseSetting("Push:VapidPublicKey", TestConfig.VapidPublicKey);
        builder.UseSetting("Push:VapidPrivateKey", TestConfig.VapidPrivateKey);
    }

    protected override void ConfigureServices(IServiceCollection services)
    {
        services.RemoveAll<DbContextOptions<AppDbContext>>();
        services.RemoveAll<AppDbContext>();
        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlite(database.ConnectionString)
        );

        // Swap the real Web Push HTTP transport for the recorder so sends are observable.
        services.RemoveAll<IWebPushTransport>();
        services.AddSingleton<IWebPushTransport>(Transport);

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
