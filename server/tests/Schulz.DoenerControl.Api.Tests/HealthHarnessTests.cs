using System.Net;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Schulz.DoenerControl.Api.Endpoints.Health;
using Schulz.DoenerControl.Infrastructure.Persistence;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests;

public sealed class HealthHarnessTests : DoenerControlTestBase
{
    public HealthHarnessTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Return_Ok_When_Health_Is_Requested_On_Fresh_Sqlite_Db()
    {
        var (response, body) = await App.Client.GETAsync<GetHealth, GetHealthResponse>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.Equal("Healthy", body.Status);
    }

    [Fact]
    public void Should_Use_Sqlite_Provider_When_Booted_Via_Harness()
    {
        using var scope = App.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        Assert.Equal("Microsoft.EntityFrameworkCore.Sqlite", database.Database.ProviderName);
    }

    [Fact]
    public void Should_Resolve_Sqlite_Connection_String_From_Test_Config()
    {
        using var scope = App.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var connectionString = database.Database.GetConnectionString();

        Assert.NotNull(connectionString);
        Assert.Contains("doener-test-", connectionString);
        Assert.EndsWith(".db", connectionString);
    }
}
