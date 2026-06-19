namespace Schulz.DoenerControl.Infrastructure.Push;

// VAPID identity for Web Push, bound from configuration (never committed in appsettings). Subject is
// a mailto:/https: contact the push service can reach; the keypair signs the push requests.
public sealed class VapidOptions
{
    public const string SectionName = "Push";
    public const string SubjectConfigKey = "Push:VapidSubject";
    public const string PublicKeyConfigKey = "Push:VapidPublicKey";
    public const string PrivateKeyConfigKey = "Push:VapidPrivateKey";

    public string Subject { get; set; } = string.Empty;

    public string PublicKey { get; set; } = string.Empty;

    public string PrivateKey { get; set; } = string.Empty;
}
