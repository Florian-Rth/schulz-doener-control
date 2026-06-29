using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using Schulz.DoenerControl.Application.Email;

namespace Schulz.DoenerControl.Infrastructure.Email;

// MailKit-backed SMTP sender. The constructor does NO I/O (it only snapshots the bound options), so
// it is safe to resolve at startup and to read IsEnabled from anywhere (e.g. the client-config flag).
// A connection is opened per send and disposed right after.
public sealed class SmtpEmailService : IEmailService
{
    private readonly SmtpOptions options;

    public SmtpEmailService(IOptions<SmtpOptions> options)
    {
        this.options = options.Value;
    }

    public bool IsEnabled => options.IsConfigured;

    public async Task SendAsync(EmailMessage message, CancellationToken ct)
    {
        var mime = new MimeMessage();
        mime.From.Add(new MailboxAddress(options.FromName, options.FromAddress));
        mime.To.Add(MailboxAddress.Parse(message.ToAddress));
        mime.Subject = message.Subject;

        var builder = new BodyBuilder { TextBody = message.Body };
        if (message.Attachment is { } attachment)
        {
            builder.Attachments.Add(
                attachment.FileName,
                attachment.Content,
                ContentType.Parse(attachment.ContentType)
            );
        }
        mime.Body = builder.ToMessageBody();

        using var client = new SmtpClient();
        // Explicit by design: STARTTLS when enabled (the shipped default), otherwise a plain
        // connection. We never use SecureSocketOptions.Auto — its opportunistic fallback could
        // silently send credentials in cleartext if a server fails to advertise STARTTLS.
        var socketOptions = options.UseStartTls
            ? SecureSocketOptions.StartTls
            : SecureSocketOptions.None;
        await client.ConnectAsync(options.Host, options.Port, socketOptions, ct);
        if (!string.IsNullOrWhiteSpace(options.User))
        {
            await client.AuthenticateAsync(options.User, options.Password, ct);
        }
        await client.SendAsync(mime, ct);
        await client.DisconnectAsync(quit: true, ct);
    }
}
