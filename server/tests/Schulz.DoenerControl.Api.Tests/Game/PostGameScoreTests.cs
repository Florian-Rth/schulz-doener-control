using System.Net;
using System.Net.Http.Json;
using Schulz.DoenerControl.Api.Endpoints.Game;
using Schulz.DoenerControl.Api.Tests.Auth;
using Schulz.DoenerControl.Core.Enums;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Game;

public sealed class PostGameScoreTests : DoenerControlTestBase
{
    private const string ScoresUrl = "/api/game/scores";

    public PostGameScoreTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Return_Unauthorized_When_Not_Authenticated()
    {
        var auth = new AuthTestClient(App.CreateClient());

        var response = await auth.PostJsonAsync(ScoresUrl, Round(120, 6, 2));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Should_Store_Round_On_Todays_Doener_Tag_When_A_Day_Is_Open()
    {
        var dayId = await GameTestData.SeedDayAsync(App, GameTestData.Today, OrderDayStatus.Open);
        var chef = await GameTestData.LoginAsChefAsync(App);

        var response = await chef.PostJsonAsync(ScoresUrl, Round(240, 9, 3));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await ReadAsync(response);
        Assert.Equal(240, body.Score);
        Assert.True(body.IsPersonalBest);

        var chefId = await GameTestData.UserIdAsync(App, TestSeeding.ChefUsername);
        var stored = Assert.Single(await GameTestData.ScoresOfAsync(App, chefId));
        Assert.Equal(body.Id, stored.Id);
        Assert.Equal(dayId, stored.OrderDayId);
        Assert.Equal(9, stored.Hits);
        Assert.Equal(3, stored.Misses);
        Assert.Equal(FixedTimeProvider.Instant, stored.PlayedAt);
    }

    [Fact]
    public async Task Should_Store_Round_Without_Day_When_There_Is_No_Doener_Tag_Today()
    {
        await GameTestData.SeedDayAsync(App, GameTestData.Today.AddDays(-7), OrderDayStatus.Closed);
        var chef = await GameTestData.LoginAsChefAsync(App);

        var response = await chef.PostJsonAsync(ScoresUrl, Round(50, 3, 8));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var chefId = await GameTestData.UserIdAsync(App, TestSeeding.ChefUsername);
        var stored = Assert.Single(await GameTestData.ScoresOfAsync(App, chefId));
        Assert.Null(stored.OrderDayId);
    }

    [Fact]
    public async Task Should_Not_Flag_Personal_Best_When_Round_Is_Worse_Than_Before()
    {
        var chefId = await GameTestData.UserIdAsync(App, TestSeeding.ChefUsername);
        await GameTestData.SeedScoreAsync(App, chefId, null, 500);
        var chef = await GameTestData.LoginAsChefAsync(App);

        var response = await chef.PostJsonAsync(ScoresUrl, Round(300, 12, 1));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.False((await ReadAsync(response)).IsPersonalBest);
    }

    [Theory]
    [InlineData(-1, 0, 0)]
    [InlineData(10, -1, 0)]
    [InlineData(10, 1, -1)]
    [InlineData(91, 1, 0)]
    [InlineData(0, 100, 21)]
    [InlineData(100000, 120, 0)]
    public async Task Should_Reject_Round_When_Numbers_Are_Implausible(
        int score,
        int hits,
        int misses
    )
    {
        var chef = await GameTestData.LoginAsChefAsync(App);

        var response = await chef.PostJsonAsync(ScoresUrl, Round(score, hits, misses));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var chefId = await GameTestData.UserIdAsync(App, TestSeeding.ChefUsername);
        Assert.Empty(await GameTestData.ScoresOfAsync(App, chefId));
    }

    private static object Round(int score, int hits, int misses) =>
        new
        {
            Score = score,
            Hits = hits,
            Misses = misses,
        };

    private static async Task<PostGameScoreResponse> ReadAsync(HttpResponseMessage response)
    {
        var body = await response.Content.ReadFromJsonAsync<PostGameScoreResponse>(
            TestContext.Current.CancellationToken
        );
        Assert.NotNull(body);
        return body!;
    }
}
