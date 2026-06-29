namespace Schulz.DoenerControl.Application.Email;

// A transactional email plus an optional single attachment (the order-list PDF). Plain POCOs so the
// Application layer carries no MailKit/MimeKit types.
public sealed record EmailMessage(
    string ToAddress,
    string Subject,
    string Body,
    EmailAttachment? Attachment
);

public sealed record EmailAttachment(string FileName, string ContentType, byte[] Content);
