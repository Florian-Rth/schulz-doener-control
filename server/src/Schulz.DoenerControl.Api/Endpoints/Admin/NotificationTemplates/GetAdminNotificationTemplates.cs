using FastEndpoints;
using Schulz.DoenerControl.Application.Notifications;

namespace Schulz.DoenerControl.Api.Endpoints.Admin.NotificationTemplates;

public sealed record GetAdminNotificationTemplatesResponse(
    IReadOnlyList<AdminNotificationTemplateDto> Items
);

// Lists every open-day notification text, including disabled ones, for the admin management screen.
// Admin-only.
public sealed class GetAdminNotificationTemplates
    : EndpointWithoutRequest<GetAdminNotificationTemplatesResponse>
{
    private readonly INotificationTemplateService templateService;

    public GetAdminNotificationTemplates(INotificationTemplateService templateService)
    {
        this.templateService = templateService;
    }

    public override void Configure()
    {
        Get("/api/admin/notification-templates");
        Roles("Admin");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var result = await templateService.ListAllAsync(ct);
        var items = result.Value.Select(AdminNotificationTemplateMapper.ToDto).ToList();
        await Send.OkAsync(new GetAdminNotificationTemplatesResponse(items), cancellation: ct);
    }
}
