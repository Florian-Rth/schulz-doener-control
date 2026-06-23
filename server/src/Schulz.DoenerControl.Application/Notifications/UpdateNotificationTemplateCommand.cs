namespace Schulz.DoenerControl.Application.Notifications;

// Admin update-notification-text input. Id targets an existing row.
public sealed record UpdateNotificationTemplateCommand(
    Guid Id,
    string Synonym,
    string Body,
    bool IsActive
);
