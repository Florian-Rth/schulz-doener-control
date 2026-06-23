using FastEndpoints;
using FluentValidation;
using Schulz.DoenerControl.Application.Notifications;
using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Api.Endpoints.Admin.NotificationTemplates;

public sealed class DeleteAdminNotificationTemplateRequest
{
    [RouteParam]
    public Guid Id { get; set; }
}

public sealed class DeleteAdminNotificationTemplateRequestValidator
    : Validator<DeleteAdminNotificationTemplateRequest>
{
    public DeleteAdminNotificationTemplateRequestValidator()
    {
        RuleFor(request => request.Id).NotEmpty();
    }
}

// Hard-deletes an open-day notification text (the body is copied onto each day, never FK-referenced,
// so nothing is orphaned). 404 if no such text. Admin-only.
public sealed class DeleteAdminNotificationTemplate
    : Endpoint<DeleteAdminNotificationTemplateRequest>
{
    private readonly INotificationTemplateService templateService;

    public DeleteAdminNotificationTemplate(INotificationTemplateService templateService)
    {
        this.templateService = templateService;
    }

    public override void Configure()
    {
        Delete("/api/admin/notification-templates/{Id}");
        Roles("Admin");
    }

    public override async Task HandleAsync(
        DeleteAdminNotificationTemplateRequest req,
        CancellationToken ct
    )
    {
        var result = await templateService.DeleteAsync(req.Id, ct);
        if (!result.IsSuccess)
        {
            if (result.Status == ResultStatus.NotFound)
            {
                await Send.NotFoundAsync(ct);
                return;
            }

            await Send.ErrorsAsync(cancellation: ct);
            return;
        }

        await Send.NoContentAsync(ct);
    }
}
