using FastEndpoints;
using FluentValidation;
using Schulz.DoenerControl.Application.Fields;
using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Api.Endpoints.Admin.Fields;

public sealed class PutAdminFieldOptionRequest
{
    [RouteParam]
    public string Key { get; set; } = string.Empty;

    [RouteParam]
    public string OptionKey { get; set; } = string.Empty;

    public string Label { get; set; } = string.Empty;

    public string? Icon { get; set; }

    public int PriceDeltaCents { get; set; }

    public int SortOrder { get; set; }

    public bool IsAvailable { get; set; }
}

public sealed record PutAdminFieldOptionResponse(AdminFieldDetailsDto Item);

public sealed class PutAdminFieldOptionRequestValidator : Validator<PutAdminFieldOptionRequest>
{
    public PutAdminFieldOptionRequestValidator()
    {
        RuleFor(request => request.Key).NotEmpty().MaximumLength(64);
        RuleFor(request => request.OptionKey).NotEmpty().MaximumLength(64);

        RuleFor(request => request.Label)
            .NotEmpty()
            .WithMessage("Die Bezeichnung darf nicht leer sein, Chef.")
            .MaximumLength(128);

        RuleFor(request => request.Icon).MaximumLength(64);
    }
}

// Edits an option's label/icon/price/sort/availability (its key is immutable). Works for reserved
// options too — only their key and their existence are protected. The response is the whole field's
// details. 404 if the field or option is missing. Admin-only.
public sealed class PutAdminFieldOption
    : Endpoint<PutAdminFieldOptionRequest, PutAdminFieldOptionResponse>
{
    private readonly IFieldService fieldService;

    public PutAdminFieldOption(IFieldService fieldService)
    {
        this.fieldService = fieldService;
    }

    public override void Configure()
    {
        Put("/api/admin/fields/{Key}/options/{OptionKey}");
        Roles("Admin");
    }

    public override async Task HandleAsync(PutAdminFieldOptionRequest req, CancellationToken ct)
    {
        var command = new UpdateFieldOptionCommand(
            req.Key,
            req.OptionKey,
            req.Label,
            req.Icon,
            req.PriceDeltaCents,
            req.SortOrder,
            req.IsAvailable
        );

        var result = await fieldService.UpdateOptionAsync(command, ct);
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
            new PutAdminFieldOptionResponse(AdminFieldMapper.ToDto(result.Value)),
            cancellation: ct
        );
    }
}
