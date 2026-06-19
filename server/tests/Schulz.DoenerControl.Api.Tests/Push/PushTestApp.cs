using FastEndpoints.Testing;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Data.Sqlite;
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
public sealed class PushTestApp : AppFixture<Program>
{
    private readonly string connectionString = new SqliteConnectionStringBuilder
    {
        DataSource = $"doener-push-test-{Guid.NewGuid():N}.db",
        Mode = SqliteOpenMode.Memory,
        Cache = SqliteCacheMode.Shared,
    }.ToString();

    private SqliteConnection keepAliveConnection = null!;

    public RecordingWebPushTransport Transport { get; } = new();

    protected override void ConfigureApp(IWebHostBuilder builder)
    {
        keepAliveConnection = new SqliteConnection(connectionString);
        keepAliveConnection.Open();

        builder.UseEnvironment("Testing");

        builder.UseSetting("ConnectionStrings:AppDb", connectionString);
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
        services.AddDbContext<AppDbContext>(options => options.UseSqlite(connectionString));

        // Swap the real Web Push HTTP transport for the recorder so sends are observable.
        services.RemoveAll<IWebPushTransport>();
        services.AddSingleton<IWebPushTransport>(Transport);

        TestClock.Override(services);
    }

    protected override async ValueTask SetupAsync()
    {
        await Services.MigrateAsync();
        await Services.SeedStandardTestUsersAsync();
    }

    protected override ValueTask TearDownAsync()
    {
        keepAliveConnection.Dispose();
        return ValueTask.CompletedTask;
    }
}
