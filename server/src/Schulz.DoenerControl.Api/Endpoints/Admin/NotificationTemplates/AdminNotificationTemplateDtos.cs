using Schulz.DoenerControl.Application.Notifications;

namespace Schulz.DoenerControl.Api.Endpoints.Admin.NotificationTemplates;

// Endpoint-layer projection of one open-day notification text for the admin screen, shared by the
// list, create and update responses. Mapped from the Application NotificationTemplateDetails so the
// service type never leaks across the boundary.
public sealed record AdminNotificationTemplateDto(
    Guid Id,
    string Synonym,
    string Body,
    bool IsActive
);

public static class AdminNotificationTemplateMapper
{
    public static AdminNotificationTemplateDto ToDto(NotificationTemplateDetails details) =>
        new(details.Id, details.Synonym, details.Body, details.IsActive);
}
