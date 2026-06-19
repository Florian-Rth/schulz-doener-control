namespace Schulz.DoenerControl.Application.Push;

// One push destination: the browser push service endpoint plus the subscription's encryption keys.
// Carries exactly what the Web Push (VAPID) transport needs to encrypt and deliver a message.
public sealed record WebPushTarget(string Endpoint, string P256dh, string Auth);
