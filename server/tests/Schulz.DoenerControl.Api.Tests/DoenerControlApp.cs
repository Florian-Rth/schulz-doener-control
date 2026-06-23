using FastEndpoints.Testing;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Schulz.DoenerControl.Infrastructure;
using Schulz.DoenerControl.Infrastructure.Persistence;

namespace Schulz.DoenerControl.Api.Tests;

// Real-SQLite integration test harness. Each test class gets its own fully isolated SQLite
// database so parallel classes never see each other's data.
//
// [DisableWafCache] is essential here: by default AppFixture caches a single SUT and shares it
// across every test class depending on this fixture type, which would also share one host —
// and thus one AppDbContext registration / one database — defeating per-class isolation.
// Disabling the cache boots a fresh SUT, and a fresh database, per test class.
[DisableWafCache]
public sealed class DoenerControlApp : AppFixture<Program>
{
    // A per-fixture, in-memory shared-cache database. The unique name makes test classes
    // process-isolated (no shared files, no timing/ordering races); the ".db" token keeps the
    // data source human-recognizable. A shared-cache in-memory DB lives only as long as at
    // least one connection is open — keepAliveConnection guarantees that for the fixture
    // lifetime, and EF's per-request connections join the same cache by name.
    private readonly string connectionString = new SqliteConnectionStringBuilder
    {
        DataSource = $"doener-test-{Guid.NewGuid():N}.db",
        Mode = SqliteOpenMode.Memory,
        Cache = SqliteCacheMode.Shared,
    }.ToString();

    private SqliteConnection keepAliveConnection = null!;

    protected override void ConfigureApp(IWebHostBuilder builder)
    {
        keepAliveConnection = new SqliteConnection(connectionString);
        keepAliveConnection.Open();

        builder.UseEnvironment("Testing");

        // Test secrets injected via host config so no real production secret is ever needed.
        // The wiring slots exist now; the auth feature consumes them later.
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
        // Strip the real AppDbContext registration and re-point it at this fixture's database.
        services.RemoveAll<DbContextOptions<AppDbContext>>();
        services.RemoveAll<AppDbContext>();
        services.AddDbContext<AppDbContext>(options => options.UseSqlite(connectionString));

        TestClock.Override(services);
    }

    protected override async ValueTask SetupAsync()
    {
        // The harness is the single owner of migration + seeding under the Testing environment
        // (Program skips its startup migrate there to avoid racing this). Applies the REAL
        // migrations — never EnsureCreated — so the migration itself is exercised by every test,
        // then seeds the explicit test cast (not the production bootstrap admin) so authenticated
        // tests have the named accounts their scenarios act on.
        await Services.MigrateAsync();
        await Services.SeedMenuAsync();
        await Services.SeedNotificationTemplatesAsync();
        await Services.SeedStandardTestUsersAsync();
    }

    protected override ValueTask TearDownAsync()
    {
        // Closing the only open connection drops this fixture's in-memory database.
        keepAliveConnection.Dispose();
        return ValueTask.CompletedTask;
    }
}
