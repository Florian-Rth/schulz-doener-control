using System.Net;
using System.Net.Http.Json;
using Schulz.DoenerControl.Api.Endpoints.Game;
using Schulz.DoenerControl.Api.Tests.Auth;
using Schulz.DoenerControl.Core.Enums;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Game;

public sealed class GetGameLeaderboardTests : DoenerControlTestBase
{
    private const string LeaderboardUrl = "/api/game/leaderboard";

    public GetGameLeaderboardTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Return_Unauthorized_When_Not_Authenticated()
    {
        var auth = new AuthTestClient(App.CreateClient());

        var response = await auth.GetAsync(LeaderboardUrl);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Should_Rank_Todays_Best_Rounds_Per_Colleague_And_Flag_Current_User()
    {
        var todayId = await GameTestData.SeedDayAsync(App, GameTestData.Today, OrderDayStatus.Open);
        var lastWeekId = await GameTestData.SeedDayAsync(
            App,
            GameTestData.Today.AddDays(-7),
            OrderDayStatus.Closed
        );
        var chefId = await GameTestData.UserIdAsync(App, TestSeeding.ChefUsername);
        var lukasId = await GameTestData.UserIdAsync(App, "l.brandt");
        var saraId = await GameTestData.UserIdAsync(App, "s.yilmaz");

        await GameTestData.SeedScoreAsync(App, chefId, todayId, 150);
        await GameTestData.SeedScoreAsync(App, chefId, todayId, 310);
        await GameTestData.SeedScoreAsync(App, lukasId, todayId, 420);
        // Last week's monster round belongs to the all-time list only.
        await GameTestData.SeedScoreAsync(App, saraId, lastWeekId, 900);

        var body = await GetAsync(await GameTestData.LoginAsChefAsync(App));

        Assert.Equal(new[] { lukasId, chefId }, body.Today.Select(entry => entry.UserId));
        Assert.Equal(new[] { 420, 310 }, body.Today.Select(entry => entry.Score));
        Assert.Equal(new[] { 1, 2 }, body.Today.Select(entry => entry.Rank));
        var chefEntry = body.Today.Single(entry => entry.UserId == chefId);
        Assert.True(chefEntry.IsMe);
        Assert.Equal("MW", chefEntry.Initials);
        Assert.Equal(TestSeeding.ChefDisplayName, chefEntry.DisplayName);
        Assert.False(string.IsNullOrWhiteSpace(chefEntry.AvatarColorHex));
        Assert.False(body.Today.Single(entry => entry.UserId == lukasId).IsMe);

        Assert.Equal(new[] { saraId, lukasId, chefId }, body.AllTime.Select(entry => entry.UserId));
    }

    [Fact]
    public async Task Should_Cut_All_Time_List_To_Top_Five_With_Shared_Ranks_For_Ties()
    {
        var userNames = new[] { "l.brandt", "s.yilmaz", "t.klein", "a.schaefer", "j.hoffmann" };
        var scores = new[] { 500, 400, 400, 300, 200 };
        for (var i = 0; i < userNames.Length; i++)
        {
            var userId = await GameTestData.UserIdAsync(App, userNames[i]);
            await GameTestData.SeedScoreAsync(App, userId, null, scores[i]);
        }
        var chefId = await GameTestData.UserIdAsync(App, TestSeeding.ChefUsername);
        await GameTestData.SeedScoreAsync(App, chefId, null, 100);

        var body = await GetAsync(await GameTestData.LoginAsChefAsync(App));

        Assert.Empty(body.Today);
        Assert.Equal(5, body.AllTime.Count);
        Assert.Equal(scores, body.AllTime.Select(entry => entry.Score));
        Assert.Equal(new[] { 1, 2, 2, 4, 5 }, body.AllTime.Select(entry => entry.Rank));
        Assert.DoesNotContain(body.AllTime, entry => entry.IsMe);
    }

    private static async Task<GetGameLeaderboardResponse> GetAsync(AuthTestClient client)
    {
        var response = await client.GetAsync(LeaderboardUrl);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<GetGameLeaderboardResponse>(
            TestContext.Current.CancellationToken
        );
        Assert.NotNull(body);
        return body!;
    }
}
