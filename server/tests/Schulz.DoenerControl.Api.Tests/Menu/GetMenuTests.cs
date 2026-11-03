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

    private async Task<GetMenuResponse> GetMenuAsync()
    {
        var auth = new AuthTestClient(App.CreateClient());
        await auth.PostJsonAsync(
            LoginUrl,
            new { Username = "m.wagner", Password = "doener-dev-2026" }
        );

        var response = await auth.GetAsync(MenuUrl);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<GetMenuResponse>(
            TestContext.Current.CancellationToken
        );
        Assert.NotNull(body);
        return body!;
    }

    [Fact]
    public async Task Should_Return_Unauthorized_When_Not_Authenticated()
    {
        var auth = new AuthTestClient(App.CreateClient());

        var response = await auth.GetAsync(MenuUrl);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Should_Return_Six_Items_And_Three_Categories_With_Generic_Fields()
    {
        var body = await GetMenuAsync();

        Assert.Equal(6, body.Items.Count);
        Assert.Equal(
            ["doener", "doenerbox", "pizza"],
            body.Categories.Select(category => category.Key).ToArray()
        );

        var doener = body.Categories.Single(category => category.Key == "doener");
        Assert.Equal(
            ["meat", "sauce", "extra"],
            doener.Fields.Select(field => field.Key).ToArray()
        );

        var meat = doener.Fields.Single(field => field.Key == "meat");
        Assert.Equal("single", meat.Type);
        Assert.Equal("segmented", meat.Display);
        Assert.True(meat.Required);
        Assert.Equal(
            ["kalb", "haehnchen", "gemischt"],
            meat.Options.Select(option => option.Key).ToArray()
        );

        var pizza = body.Categories.Single(category => category.Key == "pizza");
        var variant = pizza.Fields.Single(field => field.Key == "variant");
        Assert.Equal(
            ["margherita", "funghi", "salami", "tonno", "hawaii"],
            variant.Options.Select(option => option.Key).ToArray()
        );
        // Salami carries the +1,00 € delta.
        Assert.Equal(100, variant.Options.Single(option => option.Key == "salami").PriceDeltaCents);
    }

    [Fact]
    public async Task Should_Order_Items_By_SortOrder_When_Authenticated()
    {
        var body = await GetMenuAsync();

        var ids = body.Items.Select(item => item.Id).ToArray();
        Assert.Equal(["doener", "duerum", "big", "box", "danny", "pizza"], ids);
    }

    [Fact]
    public async Task Should_Mark_DannyBox_As_Insider_Preset_With_Defaults()
    {
        var body = await GetMenuAsync();

        var danny = body.Items.Single(item => item.Id == "danny");

        Assert.True(danny.IsInsider);
        Assert.Equal("Danny-Box", danny.Name);
        Assert.Equal("Pommes · Fleisch · Soße", danny.Note);
        Assert.Equal(600, danny.PriceCents);
        Assert.Equal("6,00 €", danny.PriceLabel);
        Assert.Equal("doenerbox", danny.CategoryKey);
        Assert.Equal("box", danny.BaseItemKey);
        Assert.Equal("workspace_premium", danny.MaterialIcon);

        // Preset defaults seed the form (gemischt / kräuter / mit Pommes / extra text).
        Assert.NotNull(danny.DefaultAnswers);
        Assert.Equal(["gemischt"], danny.DefaultAnswers!["meat"].Options);
        Assert.Equal(["pommes"], danny.DefaultAnswers["beilage"].Options);
        Assert.Equal("ohne Salat, extra Fleisch", danny.DefaultAnswers["extra"].Text);

        Assert.Single(body.Items, item => item.IsInsider);
    }

    [Fact]
    public async Task Should_Expose_German_Price_Labels_And_Category_Keys()
    {
        var body = await GetMenuAsync();

        var doener = body.Items.Single(item => item.Id == "doener");
        Assert.Equal(600, doener.PriceCents);
        Assert.Equal("6,00 €", doener.PriceLabel);
        Assert.Equal("doener", doener.CategoryKey);
        Assert.Null(doener.BaseItemKey);
        Assert.Null(doener.Note);

        var pizza = body.Items.Single(item => item.Id == "pizza");
        Assert.Equal("pizza", pizza.CategoryKey);
        Assert.Equal(900, pizza.PriceCents);
        Assert.Equal("9,00 €", pizza.PriceLabel);
        Assert.False(pizza.IsInsider);
    }
}
