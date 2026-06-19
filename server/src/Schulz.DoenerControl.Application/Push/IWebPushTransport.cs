namespace Schulz.DoenerControl.Application.Push;

// The actual Web Push (VAPID) delivery boundary: encrypts the payload for one subscription and POSTs
// it to the browser's push service. Abstracted so the broadcast logic stays framework-agnostic and
// the network send can be doubled in tests. A failure to one subscriber must not abort the fan-out.
public interface IWebPushTransport
{
    Task SendAsync(WebPushTarget target, WebPushPayload payload, CancellationToken ct);
}
