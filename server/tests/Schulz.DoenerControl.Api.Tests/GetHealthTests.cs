using System.Net;
using FastEndpoints;
using Schulz.DoenerControl.Api.Endpoints.Health;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests;

public sealed class GetHealthTests : DoenerControlTestBase
{
    public GetHealthTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Return_Ok_When_Health_Is_Requested()
    {
        var (response, body) = await App.Client.GETAsync<GetHealth, GetHealthResponse>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.Equal("Healthy", body.Status);
    }

    [Fact]
    public async Task Should_Report_A_Version_When_Health_Is_Requested()
    {
        var (response, body) = await App.Client.GETAsync<GetHealth, GetHealthResponse>();

        Assert.True(response.IsSuccessStatusCode);
        Assert.False(string.IsNullOrWhiteSpace(body.Version));
    }
}
