using System.Net;
using System.Net.Http.Json;
using System.Text;
using FastEndpoints.Testing;
using Schulz.DoenerControl.Api.Endpoints.OrderDays;
using Schulz.DoenerControl.Api.Tests.Auth;
using Schulz.DoenerControl.Api.Tests.Orders;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Email;

// SMTP "enabled" via the recording double: the endpoint runs end to end (real PDF render) and the
// captured attachment is asserted, plus every guard path, without a real SMTP server. One isolated DB
// per class; open-day is idempotent and collector take-over is unconditional, so each test sets up
// the collector it needs regardless of order.
public sealed class EmailOrderListPdfEnabledTests : TestBase<EmailEnabledApp>
{
    private const string LoginUrl = "/api/auth/login";
    private const string ChangePasswordUrl = "/api/auth/change-password";
    private const string WorkEmailUrl = "/api/profile/work-email";

    private readonly EmailEnabledApp app;

    public EmailOrderListPdfEnabledTests(EmailEnabledApp app)
    {
        this.app = app;
    }

    [Fact]
    public async Task Should_Send_Pdf_To_WorkEmail_When_Collector()
    {
        var chef = await LoginAsChefAsync();
        var dayId = await OrderTestHelpers.OpenTodayAsync(chef);
        await chef.PutJsonAsync(
            $"/api/order-days/{dayId}/orders/mine",
            OrderTestHelpers.DoenerBody(isPickup: true)
        );
        await chef.PostAsync($"/api/order-days/{dayId}/collector/claim");
        await chef.PutJsonAsync(WorkEmailUrl, new { WorkEmail = "chef@schulz.st" });

        var response = await chef.PostAsync($"/api/order-days/{dayId}/email-pdf");
        var body = await response.Content.ReadFromJsonAsync<EmailOrderListPdfResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.Equal("chef@schulz.st", body!.SentToAddress);

        var sent = app.Email.LastMessage;
        Assert.NotNull(sent);
        Assert.Equal("chef@schulz.st", sent!.ToAddress);
        Assert.NotNull(sent.Attachment);
        Assert.Equal("application/pdf", sent.Attachment!.ContentType);
        Assert.True(sent.Attachment.Content.Length > 0);
        Assert.Equal("%PDF", Encoding.ASCII.GetString(sent.Attachment.Content, 0, 4));
    }

    [Fact]
    public async Task Should_Return403_When_Caller_Not_Collector_Nor_Admin()
    {
        var chef = await LoginAsChefAsync();
        var dayId = await OrderTestHelpers.OpenTodayAsync(chef);

        // Pia never claims collector and is a plain Employee -> neither collector nor admin.
        var pia = await LoginAsColleagueAsync("p.weber", "kollegePwWeber1");
        var response = await pia.PostAsync($"/api/order-days/{dayId}/email-pdf");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Should_Return400_When_Caller_Has_No_WorkEmail()
    {
        var chef = await LoginAsChefAsync();
        var dayId = await OrderTestHelpers.OpenTodayAsync(chef);

        // Sara orders and takes over as collector, but never set a work email.
        var sara = await LoginAsColleagueAsync("s.yilmaz", "kollegePwSara1");
        await sara.PutJsonAsync(
            $"/api/order-days/{dayId}/orders/mine",
            OrderTestHelpers.DoenerBody(isPickup: false)
        );
        await sara.PostAsync($"/api/order-days/{dayId}/collector/claim");

        var response = await sara.PostAsync($"/api/order-days/{dayId}/email-pdf");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Should_Allow_Admin_When_Not_Collector()
    {
        var chef = await LoginAsChefAsync();
        var dayId = await OrderTestHelpers.OpenTodayAsync(chef);

        // Lukas orders and takes over as collector, so the chef (admin) is NOT the collector.
        var lukas = await LoginAsColleagueAsync("l.brandt", "kollegePwLukas1");
        await lukas.PutJsonAsync(
            $"/api/order-days/{dayId}/orders/mine",
            OrderTestHelpers.DoenerBody(isPickup: false)
        );
        await lukas.PostAsync($"/api/order-days/{dayId}/collector/claim");

        await chef.PutJsonAsync(WorkEmailUrl, new { WorkEmail = "admin@schulz.st" });
        var response = await chef.PostAsync($"/api/order-days/{dayId}/email-pdf");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    private async Task<AuthTestClient> LoginAsChefAsync()
    {
        var auth = new AuthTestClient(app.CreateClient());
        await auth.PostJsonAsync(
            LoginUrl,
            new { Username = TestSeeding.ChefUsername, Password = TestSeeding.ChefPassword }
        );
        return auth;
    }

    private async Task<AuthTestClient> LoginAsColleagueAsync(string username, string newPassword)
    {
        var first = new AuthTestClient(app.CreateClient());
        await first.PostJsonAsync(
            LoginUrl,
            new { Username = username, Password = TestSeeding.InitialColleaguePassword }
        );
        await first.PostJsonAsync(
            ChangePasswordUrl,
            new
            {
                CurrentPassword = TestSeeding.InitialColleaguePassword,
                NewPassword = newPassword,
            }
        );

        var auth = new AuthTestClient(app.CreateClient());
        await auth.PostJsonAsync(LoginUrl, new { Username = username, Password = newPassword });
        return auth;
    }
}
