using FastEndpoints;
using FluentValidation;
using Schulz.DoenerControl.Application.Fields;
using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Api.Endpoints.Admin.Fields;

public sealed class DeleteAdminFieldOptionRequest
{
    [RouteParam]
    public string Key { get; set; } = string.Empty;

    [RouteParam]
    public string OptionKey { get; set; } = string.Empty;
}

public sealed class DeleteAdminFieldOptionRequestValidator
    : Validator<DeleteAdminFieldOptionRequest>
{
    public DeleteAdminFieldOptionRequestValidator()
    {
        RuleFor(request => request.Key).NotEmpty().MaximumLength(64);
        RuleFor(request => request.OptionKey).NotEmpty().MaximumLength(64);
    }
}

// Removes an option. A reserved meat/sauce option is rejected with 400; otherwise the option is
// soft-retired (IsAvailable=false) so historical order answers still resolve their label, and the
// response is 204. 404 if the field or option is missing. Admin-only.
public sealed class DeleteAdminFieldOption : Endpoint<DeleteAdminFieldOptionRequest>
{
    private readonly IFieldService fieldService;

    public DeleteAdminFieldOption(IFieldService fieldService)
    {
        this.fieldService = fieldService;
    }

    public override void Configure()
    {
        Delete("/api/admin/fields/{Key}/options/{OptionKey}");
        Roles("Admin");
    }

    public override async Task HandleAsync(DeleteAdminFieldOptionRequest req, CancellationToken ct)
    {
        var result = await fieldService.DeleteOptionAsync(req.Key, req.OptionKey, ct);
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

        await Send.NoContentAsync(ct);
    }
}
