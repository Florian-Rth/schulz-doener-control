namespace Schulz.DoenerControl.Application.Email;

// Sends transactional email. IsEnabled reflects whether SMTP is configured — when false the feature
// is gracefully disabled (callers return a clear error instead of attempting a send). Implemented in
// Infrastructure (MailKit); the Application layer stays free of any mail-transport dependency.
public interface IEmailService
{
    bool IsEnabled { get; }

    Task SendAsync(EmailMessage message, CancellationToken ct);
}
