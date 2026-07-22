using FastEndpoints;
using FluentValidation;
using Schulz.DoenerControl.Application.Fields;
using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Api.Endpoints.Admin.Fields;

public sealed record PostAdminFieldRequest(
    string Key,
    string Label,
    string Type,
    string Display,
    int? MaxLength
);

public sealed record PostAdminFieldResponse(AdminFieldDetailsDto Item);

public sealed class PostAdminFieldRequestValidator : Validator<PostAdminFieldRequest>
{
    public PostAdminFieldRequestValidator()
    {
        RuleFor(request => request.Key)
            .NotEmpty()
            .WithMessage("Der Schlüssel darf nicht leer sein, Chef.")
            .MaximumLength(64);

        RuleFor(request => request.Label)
            .NotEmpty()
            .WithMessage("Die Bezeichnung darf nicht leer sein, Chef.")
            .MaximumLength(128);

        RuleFor(request => request.Type)
            .Must(FieldTokens.IsValidType)
            .WithMessage("Unbekannter Feldtyp, Chef.");

        RuleFor(request => request.Display)
            .Must(FieldTokens.IsValidDisplay)
            .WithMessage("Unbekannte Darstellung, Chef.");

        RuleFor(request => request.MaxLength)
            .GreaterThan(0)
            .When(request => request.MaxLength.HasValue)
            .WithMessage("Die maximale Länge muss positiv sein, Chef.");
    }
}

// Creates a new field definition in the active store. A duplicate key is a 409. Admin-only.
public sealed class PostAdminField : Endpoint<PostAdminFieldRequest, PostAdminFieldResponse>
{
    private readonly IFieldService fieldService;

    public PostAdminField(IFieldService fieldService)
    {
        this.fieldService = fieldService;
    }

    public override void Configure()
    {
        Post("/api/admin/fields");
        Roles("Admin");
    }

    public override async Task HandleAsync(PostAdminFieldRequest req, CancellationToken ct)
    {
        var command = new CreateFieldCommand(
            req.Key,
            req.Label,
            req.Type,
            req.Display,
            req.MaxLength
        );

        var result = await fieldService.CreateAsync(command, ct);
        if (!result.IsSuccess)
        {
            if (result.Error is { } message)
                AddError(message);

            if (result.Status == ResultStatus.Conflict)
                await Send.ErrorsAsync(StatusCodes.Status409Conflict, cancellation: ct);
            else
                await Send.ErrorsAsync(cancellation: ct);
            return;
        }

        await Send.CreatedAtAsync<GetAdminFields>(
            routeValues: null,
            responseBody: new PostAdminFieldResponse(AdminFieldMapper.ToDto(result.Value)),
            generateAbsoluteUrl: false,
            cancellation: ct
        );
    }
}
