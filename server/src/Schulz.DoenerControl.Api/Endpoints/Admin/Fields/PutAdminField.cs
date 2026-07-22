using FastEndpoints;
using FluentValidation;
using Schulz.DoenerControl.Application.Fields;
using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Api.Endpoints.Admin.Fields;

public sealed class PutAdminFieldRequest
{
    [RouteParam]
    public string Key { get; set; } = string.Empty;

    public string Label { get; set; } = string.Empty;

    public string Display { get; set; } = string.Empty;

    public int? MaxLength { get; set; }
}

public sealed record PutAdminFieldResponse(AdminFieldDetailsDto Item);

public sealed class PutAdminFieldRequestValidator : Validator<PutAdminFieldRequest>
{
    public PutAdminFieldRequestValidator()
    {
        RuleFor(request => request.Key).NotEmpty().MaximumLength(64);

        RuleFor(request => request.Label)
            .NotEmpty()
            .WithMessage("Die Bezeichnung darf nicht leer sein, Chef.")
            .MaximumLength(128);

        RuleFor(request => request.Display)
            .Must(FieldTokens.IsValidDisplay)
            .WithMessage("Unbekannte Darstellung, Chef.");

        RuleFor(request => request.MaxLength)
            .GreaterThan(0)
            .When(request => request.MaxLength.HasValue)
            .WithMessage("Die maximale Länge muss positiv sein, Chef.");
    }
}

// Edits an existing field's label/display/max-length (key and type are immutable). 404 if no such
// field. Admin-only.
public sealed class PutAdminField : Endpoint<PutAdminFieldRequest, PutAdminFieldResponse>
{
    private readonly IFieldService fieldService;

    public PutAdminField(IFieldService fieldService)
    {
        this.fieldService = fieldService;
    }

    public override void Configure()
    {
        Put("/api/admin/fields/{Key}");
        Roles("Admin");
    }

    public override async Task HandleAsync(PutAdminFieldRequest req, CancellationToken ct)
    {
        var command = new UpdateFieldCommand(req.Key, req.Label, req.Display, req.MaxLength);

        var result = await fieldService.UpdateAsync(command, ct);
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
            new PutAdminFieldResponse(AdminFieldMapper.ToDto(result.Value)),
            cancellation: ct
        );
    }
}
