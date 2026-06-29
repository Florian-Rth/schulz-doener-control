using Schulz.DoenerControl.Application.Email;

namespace Schulz.DoenerControl.Api.Tests.Email;

// A test double for IEmailService that reports itself as enabled and records the last message it was
// asked to send, so the email-PDF endpoint runs end to end (real PDF render) and the captured
// attachment can be asserted — without any real SMTP server.
public sealed class RecordingEmailService : IEmailService
{
    public EmailMessage? LastMessage { get; private set; }

    public bool IsEnabled => true;

    public Task SendAsync(EmailMessage message, CancellationToken ct)
    {
        LastMessage = message;
        return Task.CompletedTask;
    }
}
