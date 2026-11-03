using FastEndpoints;
using FluentValidation;
using Schulz.DoenerControl.Application.Fields;
using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Api.Endpoints.Admin.Fields;

public sealed class DeleteAdminFieldRequest
{
    [RouteParam]
    public string Key { get; set; } = string.Empty;
}

public sealed class DeleteAdminFieldRequestValidator : Validator<DeleteAdminFieldRequest>
{
    public DeleteAdminFieldRequestValidator()
    {
        RuleFor(request => request.Key).NotEmpty().MaximumLength(64);
    }
}

// Removes a field definition. A reserved field (meat/sauce) is rejected with 400; a field still
// referenced by any category link is rejected with 409; otherwise it is deleted (its options cascade)
// and the response is 204. 404 if no such field. Admin-only.
public sealed class DeleteAdminField : Endpoint<DeleteAdminFieldRequest>
{
    private readonly IFieldService fieldService;

    public DeleteAdminField(IFieldService fieldService)
    {
        this.fieldService = fieldService;
    }

    public override void Configure()
    {
        Delete("/api/admin/fields/{Key}");
        Roles("Admin");
    }

    public override async Task HandleAsync(DeleteAdminFieldRequest req, CancellationToken ct)
    {
        var result = await fieldService.DeleteAsync(req.Key, ct);
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

        await Send.NoContentAsync(ct);
    }
}
