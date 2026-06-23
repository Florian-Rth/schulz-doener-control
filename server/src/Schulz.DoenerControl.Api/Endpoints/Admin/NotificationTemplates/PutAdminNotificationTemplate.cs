using FastEndpoints;
using FluentValidation;
using Schulz.DoenerControl.Application.Notifications;
using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Api.Endpoints.Admin.NotificationTemplates;

public sealed class PutAdminNotificationTemplateRequest
{
    [RouteParam]
    public Guid Id { get; set; }

    public string Synonym { get; set; } = string.Empty;

    public string Body { get; set; } = string.Empty;

    public bool IsActive { get; set; }
}

public sealed record PutAdminNotificationTemplateResponse(AdminNotificationTemplateDto Item);

public sealed class PutAdminNotificationTemplateRequestValidator
    : Validator<PutAdminNotificationTemplateRequest>
{
    public PutAdminNotificationTemplateRequestValidator()
    {
        RuleFor(request => request.Id).NotEmpty();

        RuleFor(request => request.Synonym)
            .NotEmpty()
            .WithMessage("Das Döner-Synonym darf nicht leer sein, Chef.")
            .MaximumLength(64);

        RuleFor(request => request.Body)
            .NotEmpty()
            .WithMessage("Der Text darf nicht leer sein, Chef.")
            .MaximumLength(280);
    }
}

// Edits an existing open-day notification text. 404 if no such text. Admin-only.
public sealed class PutAdminNotificationTemplate
    : Endpoint<PutAdminNotificationTemplateRequest, PutAdminNotificationTemplateResponse>
{
    private readonly INotificationTemplateService templateService;

    public PutAdminNotificationTemplate(INotificationTemplateService templateService)
    {
        this.templateService = templateService;
    }

    public override void Configure()
    {
        Put("/api/admin/notification-templates/{Id}");
        Roles("Admin");
    }

    public override async Task HandleAsync(
        PutAdminNotificationTemplateRequest req,
        CancellationToken ct
    )
    {
        var command = new UpdateNotificationTemplateCommand(
            req.Id,
            req.Synonym,
            req.Body,
            req.IsActive
        );

        var result = await templateService.UpdateAsync(command, ct);
        if (!result.IsSuccess)
        {
            if (result.Status == ResultStatus.NotFound)
            {
                await Send.NotFoundAsync(ct);
                return;
            }

            if (result.Error is { } message)
                AddError(message);

            await Send.ErrorsAsync(cancellation: ct);
            return;
        }

        await Send.OkAsync(
            new PutAdminNotificationTemplateResponse(
                AdminNotificationTemplateMapper.ToDto(result.Value)
            ),
            cancellation: ct
        );
    }
}
