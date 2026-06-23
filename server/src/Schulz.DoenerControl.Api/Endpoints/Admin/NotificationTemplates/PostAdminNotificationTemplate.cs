using FastEndpoints;
using FluentValidation;
using Schulz.DoenerControl.Application.Notifications;

namespace Schulz.DoenerControl.Api.Endpoints.Admin.NotificationTemplates;

public sealed record PostAdminNotificationTemplateRequest(
    string Synonym,
    string Body,
    bool IsActive
);

public sealed record PostAdminNotificationTemplateResponse(AdminNotificationTemplateDto Item);

public sealed class PostAdminNotificationTemplateRequestValidator
    : Validator<PostAdminNotificationTemplateRequest>
{
    public PostAdminNotificationTemplateRequestValidator()
    {
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

// Creates a new open-day notification text. Admin-only.
public sealed class PostAdminNotificationTemplate
    : Endpoint<PostAdminNotificationTemplateRequest, PostAdminNotificationTemplateResponse>
{
    private readonly INotificationTemplateService templateService;

    public PostAdminNotificationTemplate(INotificationTemplateService templateService)
    {
        this.templateService = templateService;
    }

    public override void Configure()
    {
        Post("/api/admin/notification-templates");
        Roles("Admin");
    }

    public override async Task HandleAsync(
        PostAdminNotificationTemplateRequest req,
        CancellationToken ct
    )
    {
        var command = new CreateNotificationTemplateCommand(req.Synonym, req.Body, req.IsActive);

        var result = await templateService.CreateAsync(command, ct);
        if (!result.IsSuccess)
        {
            if (result.Error is { } message)
                AddError(message);

            await Send.ErrorsAsync(cancellation: ct);
            return;
        }

        await Send.CreatedAtAsync<GetAdminNotificationTemplates>(
            routeValues: null,
            responseBody: new PostAdminNotificationTemplateResponse(
                AdminNotificationTemplateMapper.ToDto(result.Value)
            ),
            generateAbsoluteUrl: false,
            cancellation: ct
        );
    }
}
