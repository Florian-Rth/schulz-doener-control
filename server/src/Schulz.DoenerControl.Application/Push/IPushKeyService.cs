namespace Schulz.DoenerControl.Application.Push;

// Exposes the server's VAPID public key to the API layer without leaking the Infrastructure
// VapidOptions across the service boundary. The browser needs this key as the
// applicationServerKey before it can create a push subscription.
public interface IPushKeyService
{
    string GetPublicKey();
}
