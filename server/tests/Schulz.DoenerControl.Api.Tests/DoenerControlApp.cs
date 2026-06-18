using FastEndpoints.Testing;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Schulz.DoenerControl.Infrastructure.Persistence;

namespace Schulz.DoenerControl.Api.Tests;

// Real-SQLite integration test harness. FastEndpoints.Testing gives one fixture instance
// per test class, so each test class gets its own isolated temp-file SQLite database.
// Parallel test classes are safe because the file names carry a unique Guid.
public sealed class DoenerControlApp : AppFixture<Program>
{
    private string databaseFilePath = string.Empty;

    protected override void ConfigureApp(IWebHostBuilder builder)
    {
        databaseFilePath = Path.Combine(Path.GetTempPath(), $"doener-test-{Guid.NewGuid():N}.db");

        builder.UseEnvironment("Testing");

        // Test secrets injected via host config so no real production secret is ever needed.
        // The wiring slots exist now; the auth feature consumes them later.
        builder.UseSetting("ConnectionStrings:AppDb", $"Data Source={databaseFilePath}");
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
        // Strip the real AppDbContext registration and re-point it at our isolated temp file.
        services.RemoveAll<DbContextOptions<AppDbContext>>();
        services.RemoveAll<AppDbContext>();
        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlite($"Data Source={databaseFilePath}")
        );
    }

    protected override async ValueTask SetupAsync()
    {
        using var scope = Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // Apply REAL migrations (no-op until the InitialCreate migration lands in F1),
        // never EnsureCreated, so the migration itself is exercised by every test.
        await database.Database.MigrateAsync();
    }

    protected override ValueTask TearDownAsync()
    {
        // Release the file handle before deleting the throwaway database.
        SqliteConnection.ClearAllPools();
        if (File.Exists(databaseFilePath))
        {
            File.Delete(databaseFilePath);
        }

        return ValueTask.CompletedTask;
    }
}
