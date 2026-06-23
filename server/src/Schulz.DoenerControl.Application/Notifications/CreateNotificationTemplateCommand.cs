namespace Schulz.DoenerControl.Application.Notifications;

// Admin create-notification-text input. Id is assigned by the service.
public sealed record CreateNotificationTemplateCommand(string Synonym, string Body, bool IsActive);
