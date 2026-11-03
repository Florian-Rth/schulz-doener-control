using FastEndpoints;
using FluentValidation;
using Schulz.DoenerControl.Application.Fields;
using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Api.Endpoints.Admin.Fields;

// The route token is FieldKey (a distinct name) so the body's own `Key` — the new option's key — can
// bind without colliding with the owning field's route key.
public sealed class PostAdminFieldOptionRequest
{
    [RouteParam]
    public string FieldKey { get; set; } = string.Empty;

    public string Key { get; set; } = string.Empty;

    public string Label { get; set; } = string.Empty;

    public string? Icon { get; set; }

    public int PriceDeltaCents { get; set; }

    public int SortOrder { get; set; }

    public bool IsAvailable { get; set; }
}

public sealed record PostAdminFieldOptionResponse(AdminFieldDetailsDto Item);

public sealed class PostAdminFieldOptionRequestValidator : Validator<PostAdminFieldOptionRequest>
{
    public PostAdminFieldOptionRequestValidator()
    {
        RuleFor(request => request.FieldKey).NotEmpty().MaximumLength(64);

        RuleFor(request => request.Key)
            .NotEmpty()
            .WithMessage("Der Schlüssel darf nicht leer sein, Chef.")
            .MaximumLength(64);

        RuleFor(request => request.Label)
            .NotEmpty()
            .WithMessage("Die Bezeichnung darf nicht leer sein, Chef.")
            .MaximumLength(128);

        RuleFor(request => request.Icon).MaximumLength(64);
    }
}

// Adds an option to a select field. The response is the whole field's details. A duplicate option key
// within the field is a 409; a missing field is a 404. Admin-only.
public sealed class PostAdminFieldOption
    : Endpoint<PostAdminFieldOptionRequest, PostAdminFieldOptionResponse>
{
    private readonly IFieldService fieldService;

    public PostAdminFieldOption(IFieldService fieldService)
    {
        this.fieldService = fieldService;
    }

    public override void Configure()
    {
        Post("/api/admin/fields/{FieldKey}/options");
        Roles("Admin");
    }

    public override async Task HandleAsync(PostAdminFieldOptionRequest req, CancellationToken ct)
    {
        var command = new AddFieldOptionCommand(
            req.FieldKey,
            req.Key,
            req.Label,
            req.Icon,
            req.PriceDeltaCents,
            req.SortOrder,
            req.IsAvailable
        );

        var result = await fieldService.AddOptionAsync(command, ct);
        if (!result.IsSuccess)
        {
            if (result.Status == ResultStatus.NotFound)
            {
                await Send.NotFoundAsync(ct);
                return;
            }

            if (result.Error is { } message)
                AddError(message);

            if (result.Status == ResultStatus.Conflict)
                await Send.ErrorsAsync(StatusCodes.Status409Conflict, cancellation: ct);
            else
                await Send.ErrorsAsync(cancellation: ct);
            return;
        }

        await Send.OkAsync(
            new PostAdminFieldOptionResponse(AdminFieldMapper.ToDto(result.Value)),
            cancellation: ct
        );
    }
}
