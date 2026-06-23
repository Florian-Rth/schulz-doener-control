namespace Schulz.DoenerControl.Application.Notifications;

// Admin view of a single open-day notification text: the themed Döner synonym, the message body and
// whether it is eligible for the random pick when a Döner-Tag opens.
public sealed record NotificationTemplateDetails(
    Guid Id,
    string Synonym,
    string Body,
    bool IsActive
);
