using System.Net;
using FastEndpoints;
using FastEndpoints.Testing;
using Schulz.DoenerControl.Api.Endpoints.Health;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests;

public sealed class GetHealthTests : TestBase<DoenerControlApp>
{
    private readonly DoenerControlApp app;

    public GetHealthTests(DoenerControlApp app)
    {
        this.app = app;
    }

    [Fact]
    public async Task Should_Return_Ok_When_Health_Is_Requested()
    {
        var (response, body) = await app.Client.GETAsync<GetHealth, GetHealthResponse>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.Equal("Healthy", body.Status);
    }

    [Fact]
    public async Task Should_Report_A_Version_When_Health_Is_Requested()
    {
        var (response, body) = await app.Client.GETAsync<GetHealth, GetHealthResponse>();

        Assert.True(response.IsSuccessStatusCode);
        Assert.False(string.IsNullOrWhiteSpace(body.Version));
    }
}
