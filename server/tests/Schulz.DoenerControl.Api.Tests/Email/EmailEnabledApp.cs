using FastEndpoints.Testing;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Schulz.DoenerControl.Application.Email;
using Schulz.DoenerControl.Infrastructure;
using Schulz.DoenerControl.Infrastructure.Persistence;

namespace Schulz.DoenerControl.Api.Tests.Email;

// A mail-enabled variant of the real-SQLite harness: the real SMTP sender is replaced by a recording
// double whose IsEnabled is true, so the email-PDF endpoint runs end to end (real PDF render) and the
// captured attachment can be asserted — without any real SMTP server. Same per-class isolated DB as
// the default harness; seeds menu + notification templates so orders and day-open work.
[DisableWafCache]
public sealed class EmailEnabledApp : AppFixture<Program>
{
    private readonly string connectionString = new SqliteConnectionStringBuilder
    {
        DataSource = $"doener-email-test-{Guid.NewGuid():N}.db",
        Mode = SqliteOpenMode.Memory,
        Cache = SqliteCacheMode.Shared,
    }.ToString();

    private SqliteConnection keepAliveConnection = null!;

    public RecordingEmailService Email { get; } = new();

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
    }

    protected override void ConfigureServices(IServiceCollection services)
    {
        services.RemoveAll<DbContextOptions<AppDbContext>>();
        services.RemoveAll<AppDbContext>();
        services.AddDbContext<AppDbContext>(options => options.UseSqlite(connectionString));

        // Swap the real SMTP sender for the recorder (IsEnabled = true) so the endpoint runs the real
        // PDF render and the captured attachment is observable — no real SMTP server needed.
        services.RemoveAll<IEmailService>();
        services.AddSingleton<IEmailService>(Email);

        TestClock.Override(services);
    }

    protected override async ValueTask SetupAsync()
    {
        await Services.MigrateAsync();
        await Services.SeedMenuAsync();
        await Services.SeedNotificationTemplatesAsync();
        await Services.SeedStandardTestUsersAsync();
    }

    protected override ValueTask TearDownAsync()
    {
        keepAliveConnection.Dispose();
        return ValueTask.CompletedTask;
    }
}
