namespace Schulz.DoenerControl.Infrastructure.Email;

// SMTP transport config, bound from configuration (never committed — injected via env at deploy).
// The feature is a kill-switch: IsConfigured is false unless Enabled is set AND a host + from-address
// are present, so a fresh or partial deployment keeps mail-send gracefully off.
public sealed class SmtpOptions
{
    public const string SectionName = "Smtp";
    public const string EnabledConfigKey = "Smtp:Enabled";
    public const string HostConfigKey = "Smtp:Host";
    public const string PortConfigKey = "Smtp:Port";
    public const string UserConfigKey = "Smtp:User";
    public const string PasswordConfigKey = "Smtp:Password";
    public const string FromAddressConfigKey = "Smtp:FromAddress";
    public const string FromNameConfigKey = "Smtp:FromName";
    public const string UseStartTlsConfigKey = "Smtp:UseStartTls";

    public bool Enabled { get; set; }

    public string Host { get; set; } = string.Empty;

    public int Port { get; set; } = 587;

    public string User { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    public string FromAddress { get; set; } = string.Empty;

    public string FromName { get; set; } = "Schulz Döner Control";

    public bool UseStartTls { get; set; } = true;

    // Single source of truth for the kill-switch: configured only when explicitly enabled and a host
    // + sender address are present. Read by both the email service and the client-config flag.
    public bool IsConfigured =>
        Enabled && !string.IsNullOrWhiteSpace(Host) && !string.IsNullOrWhiteSpace(FromAddress);
}
