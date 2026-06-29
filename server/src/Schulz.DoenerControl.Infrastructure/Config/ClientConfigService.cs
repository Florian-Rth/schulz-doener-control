using Microsoft.Extensions.Options;
using Schulz.DoenerControl.Application.Config;
using Schulz.DoenerControl.Infrastructure.Email;

namespace Schulz.DoenerControl.Infrastructure.Config;

// Reads the bound client configuration so the API layer never touches ClientConfigOptions directly.
// The flags rarely change, so reading them per call is cheap — same shape as PushKeyService. The
// email-PDF flag is derived from SmtpOptions.IsConfigured (the same kill-switch the email service
// reads), so the SPA can hide the print-view send button when SMTP isn't set up.
public sealed class ClientConfigService : IClientConfigService
{
    private readonly ClientConfigOptions options;
    private readonly SmtpOptions smtpOptions;

    public ClientConfigService(
        IOptions<ClientConfigOptions> options,
        IOptions<SmtpOptions> smtpOptions
    )
    {
        this.options = options.Value;
        this.smtpOptions = smtpOptions.Value;
    }

    public ClientConfigDetails GetClientConfig() =>
        new(options.PwaGateEnabled, smtpOptions.IsConfigured);
}
