using System.Net;
using System.Net.Http.Json;
using Schulz.DoenerControl.Api.Endpoints.Admin.Tiers;
using Schulz.DoenerControl.Api.Tests.Auth;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Admin;

// The read-only admin Döner-Tier inspector (B4): GET /api/admin/tiere returns all 15 tier
// definitions in priority order, each with its emoji/name/tagline/tags plus a human-readable
// German trigger-condition derived from the calculator's own thresholds, and the 90-day window
// length that forms the basis. Asserted against the real host as the seeded Admin "Chef".
public sealed class GetAdminTiereTests : DoenerControlTestBase
{
    private const string TiereUrl = "/api/admin/tiere";

    public GetAdminTiereTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Return_All_Fifteen_Tiers_In_Priority_Order()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        var response = await admin.GetAsync(TiereUrl);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<GetAdminTiereResponse>(
            TestContext.Current.CancellationToken
        );
        Assert.NotNull(body);
        Assert.Equal(15, body!.Tiers.Count);
        Assert.Equal("Die Bürowaffe", body.Tiers[0].Name);
        Assert.Equal("Der Knoblauch-Wolf", body.Tiers[1].Name);
        Assert.Equal("Der Schärfe-Drache", body.Tiers[2].Name);
        Assert.Equal("Der solide Döner-Bürger", body.Tiers[14].Name);
    }

    [Fact]
    public async Task Should_Carry_Emoji_Tags_And_NonEmpty_Condition_For_Every_Tier()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        var response = await admin.GetAsync(TiereUrl);
        var body = await response.Content.ReadFromJsonAsync<GetAdminTiereResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.NotNull(body);
        foreach (var tier in body!.Tiers)
        {
            Assert.False(string.IsNullOrWhiteSpace(tier.Emoji));
            Assert.False(string.IsNullOrWhiteSpace(tier.Name));
            Assert.False(string.IsNullOrWhiteSpace(tier.Tagline));
            Assert.Equal(3, tier.Tags.Count);
            Assert.False(string.IsNullOrWhiteSpace(tier.Condition));
        }
    }

    [Fact]
    public async Task Should_Derive_Condition_Text_From_Calculator_Thresholds()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        var response = await admin.GetAsync(TiereUrl);
        var body = await response.Content.ReadFromJsonAsync<GetAdminTiereResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.NotNull(body);
        // The Knoblauch-Wolf threshold (garlic >= 0.7) must surface as a real percentage so an admin
        // can read the basis without consulting the code. The "70 %" is rendered from the same
        // constant the calculator compares against, never a hand-typed literal in the DTO.
        Assert.Equal("Knoblauch-Anteil ≥ 70 %", body!.Tiers[1].Condition);
        Assert.Contains("60 %", body.Tiers[0].Condition);
        Assert.Equal("Wenn keine andere Regel zutrifft", body.Tiers[14].Condition);
    }

    [Fact]
    public async Task Should_Report_Ninety_Day_Window_Basis()
    {
        var admin = await AdminUserTestHelpers.LoginAsAdminAsync(App);

        var response = await admin.GetAsync(TiereUrl);
        var body = await response.Content.ReadFromJsonAsync<GetAdminTiereResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.NotNull(body);
        Assert.Equal(90, body!.WindowDays);
    }
}
