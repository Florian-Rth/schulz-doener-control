using FastEndpoints;
using Schulz.DoenerControl.Application.Push;

namespace Schulz.DoenerControl.Api.Endpoints.Push;

// The server's VAPID public key, returned as the FE's PushVapidKeySchema = { publicKey }. The
// browser needs it as the applicationServerKey before it can create a push subscription.
public sealed record GetVapidPublicKeyResponse(string PublicKey);

// Exposes the configured VAPID public key to the web-push subscribe flow. The key is not secret,
// but the endpoint stays authenticated like the other push endpoints — the SPA calls it with the
// session cookie. Reads the key through the service so the Api never touches VapidOptions directly.
public sealed class GetVapidPublicKey : EndpointWithoutRequest<GetVapidPublicKeyResponse>
{
    private readonly IPushKeyService pushKeyService;

    public GetVapidPublicKey(IPushKeyService pushKeyService)
    {
        this.pushKeyService = pushKeyService;
    }

    public override void Configure()
    {
        Get("/api/push/vapid-public-key");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var publicKey = pushKeyService.GetPublicKey();
        await Send.OkAsync(new GetVapidPublicKeyResponse(publicKey), cancellation: ct);
    }
}
