using System.Net;
using System.Net.Http.Json;
using Schulz.DoenerControl.Api.Endpoints.Menu;
using Schulz.DoenerControl.Api.Tests.Auth;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Menu;

public sealed class GetMenuTests : DoenerControlTestBase
{
    private const string LoginUrl = "/api/auth/login";
    private const string MenuUrl = "/api/menu";

    public GetMenuTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Return_Unauthorized_When_Not_Authenticated()
    {
        var auth = new AuthTestClient(App.CreateClient());

        var response = await auth.GetAsync(MenuUrl);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Should_Return_Six_Menu_Items_With_Vocabularies_When_Authenticated()
    {
        var auth = new AuthTestClient(App.CreateClient());
        await auth.PostJsonAsync(
            LoginUrl,
            new { Username = "m.wagner", Password = "doener-dev-2026" }
        );

        var response = await auth.GetAsync(MenuUrl);
        var body = await response.Content.ReadFromJsonAsync<GetMenuResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.Equal(6, body!.Items.Count);

        // Vocabularies arrive in one round-trip as the canonical ASCII enum tokens (the exact strings
        // the SPA's order schema enumerates and PutMyOrder accepts) so the SPA never hardcodes them.
        Assert.Equal(["Salami", "Margherita", "Funghi", "Tonno", "Hawaii"], body.PizzaVariants);
        Assert.Equal(["Kraeuter", "Knoblauch", "Scharf"], body.SauceOptions);
        Assert.Equal(["Kalb", "Haehnchen"], body.MeatOptions);
    }

    [Fact]
    public async Task Should_Order_Items_By_SortOrder_When_Authenticated()
    {
        var auth = new AuthTestClient(App.CreateClient());
        await auth.PostJsonAsync(
            LoginUrl,
            new { Username = "m.wagner", Password = "doener-dev-2026" }
        );

        var response = await auth.GetAsync(MenuUrl);
        var body = await response.Content.ReadFromJsonAsync<GetMenuResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.NotNull(body);
        var ids = body!.Items.Select(item => item.Id).ToArray();
        Assert.Equal(["doener", "duerum", "big", "box", "danny", "pizza"], ids);
    }

    [Fact]
    public async Task Should_Mark_DannyBox_As_Insider_With_Note_When_Authenticated()
    {
        var auth = new AuthTestClient(App.CreateClient());
        await auth.PostJsonAsync(
            LoginUrl,
            new { Username = "m.wagner", Password = "doener-dev-2026" }
        );

        var response = await auth.GetAsync(MenuUrl);
        var body = await response.Content.ReadFromJsonAsync<GetMenuResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.NotNull(body);
        var danny = body!.Items.Single(item => item.Id == "danny");

        Assert.True(danny.IsInsider);
        Assert.Equal("Danny-Box", danny.Name);
        Assert.Equal("Pommes · Fleisch · Soße", danny.Note);
        Assert.Equal(600, danny.DefaultPriceCents);
        Assert.Equal("6,00 €", danny.DefaultPriceLabel);
        Assert.Equal("doener", danny.Kind);
        Assert.Equal("workspace_premium", danny.MaterialIcon);

        // No other item is flagged INSIDER.
        Assert.Single(body.Items, item => item.IsInsider);
    }

    [Fact]
    public async Task Should_Expose_German_Price_Labels_And_Pizza_Kind_When_Authenticated()
    {
        var auth = new AuthTestClient(App.CreateClient());
        await auth.PostJsonAsync(
            LoginUrl,
            new { Username = "m.wagner", Password = "doener-dev-2026" }
        );

        var response = await auth.GetAsync(MenuUrl);
        var body = await response.Content.ReadFromJsonAsync<GetMenuResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.NotNull(body);
        var doener = body!.Items.Single(item => item.Id == "doener");
        Assert.Equal("7,50 €", doener.DefaultPriceLabel);
        Assert.Equal("doener", doener.Kind);
        Assert.Null(doener.Note);

        var pizza = body.Items.Single(item => item.Id == "pizza");
        Assert.Equal("pizza", pizza.Kind);
        Assert.Equal("9,00 €", pizza.DefaultPriceLabel);
        Assert.False(pizza.IsInsider);
    }
}
