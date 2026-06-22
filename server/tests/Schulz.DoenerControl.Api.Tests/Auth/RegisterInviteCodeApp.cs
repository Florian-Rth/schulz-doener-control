using FastEndpoints.Testing;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Schulz.DoenerControl.Infrastructure;
using Schulz.DoenerControl.Infrastructure.Persistence;

namespace Schulz.DoenerControl.Api.Tests.Auth;

// An invite-code variant of the real-SQLite harness: same per-class isolated SQLite database, but
// with Auth:RegistrationInviteCode configured so the self-registration invite-code gate is active.
[DisableWafCache]
public sealed class RegisterInviteCodeApp : AppFixture<Program>
{
    public const string InviteCode = "GEHEIM-DOENER-2026";

    private readonly string connectionString = new SqliteConnectionStringBuilder
    {
        DataSource = $"doener-invite-test-{Guid.NewGuid():N}.db",
        Mode = SqliteOpenMode.Memory,
        Cache = SqliteCacheMode.Shared,
    }.ToString();

    private SqliteConnection keepAliveConnection = null!;

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
        builder.UseSetting("Auth:RegistrationInviteCode", InviteCode);
        builder.UseSetting("PasswordHashing:MemorySize", TestConfig.PasswordHashingMemorySize);
        builder.UseSetting("PasswordHashing:Iterations", TestConfig.PasswordHashingIterations);
    }

    protected override void ConfigureServices(IServiceCollection services)
    {
        services.RemoveAll<DbContextOptions<AppDbContext>>();
        services.RemoveAll<AppDbContext>();
        services.AddDbContext<AppDbContext>(options => options.UseSqlite(connectionString));

        TestClock.Override(services);
    }

    protected override async ValueTask SetupAsync()
    {
        await Services.MigrateAsync();
        await Services.SeedMenuAsync();
        await Services.SeedStandardTestUsersAsync();
    }

    protected override ValueTask TearDownAsync()
    {
        keepAliveConnection.Dispose();
        return ValueTask.CompletedTask;
    }
}
