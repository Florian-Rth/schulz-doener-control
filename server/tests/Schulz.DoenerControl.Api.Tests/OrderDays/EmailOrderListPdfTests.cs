using System.Net;
using Schulz.DoenerControl.Api.Tests.Orders;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.OrderDays;

// SMTP unconfigured (the default harness) -> the email-PDF endpoint short-circuits with 409 before
// anything else, so the feature is gracefully disabled (the kill-switch). The enabled scenarios live
// in EmailOrderListPdfEnabledTests against the mail-enabled fixture.
public sealed class EmailOrderListPdfTests : DoenerControlTestBase
{
    public EmailOrderListPdfTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Return409_When_Smtp_Disabled()
    {
        var chef = await OrderTestHelpers.LoginAsChefAsync(App);
        var dayId = await OrderTestHelpers.OpenTodayAsync(chef);

        var response = await chef.PostAsync($"/api/order-days/{dayId}/email-pdf");

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }
}
