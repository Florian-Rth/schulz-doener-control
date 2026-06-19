using System.Text.Json;
using Microsoft.Extensions.Options;
using Schulz.DoenerControl.Application.Push;
using WebPush;
using LibPushSubscription = WebPush.PushSubscription;

namespace Schulz.DoenerControl.Infrastructure.Push;

// The real Web Push (VAPID) delivery: encrypts the JSON payload for the subscription's keys and POSTs
// it to the browser push service via the WebPush library, authenticated with the configured VAPID
// identity. The service worker reads { title, body } from the payload to render the notification.
public sealed class WebPushTransport : IWebPushTransport
{
    private static readonly JsonSerializerOptions PayloadJsonOptions = new(
        JsonSerializerDefaults.Web
    );

    private readonly WebPushClient client;
    private readonly VapidDetails vapidDetails;

    public WebPushTransport(IOptions<VapidOptions> options)
    {
        var value = options.Value;
        client = new WebPushClient();
        vapidDetails = new VapidDetails(value.Subject, value.PublicKey, value.PrivateKey);
    }

    public Task SendAsync(WebPushTarget target, WebPushPayload payload, CancellationToken ct)
    {
        var subscription = new LibPushSubscription(target.Endpoint, target.P256dh, target.Auth);
        var json = JsonSerializer.Serialize(payload, PayloadJsonOptions);
        return client.SendNotificationAsync(subscription, json, vapidDetails, ct);
    }
}
