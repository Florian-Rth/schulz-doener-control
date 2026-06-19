using FastEndpoints;
using FluentValidation;
using Schulz.DoenerControl.Application.Menu;
using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Api.Endpoints.Admin.Menu;

public sealed class PutAdminMenuRequest
{
    [RouteParam]
    public string Id { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public int DefaultPriceCents { get; set; }

    public string Kind { get; set; } = string.Empty;

    public string MaterialIcon { get; set; } = string.Empty;

    public string? Note { get; set; }

    public bool IsInsider { get; set; }

    public int SortOrder { get; set; }

    public bool IsAvailable { get; set; }
}

public sealed record PutAdminMenuResponse(AdminMenuItemDto Item);

public sealed class PutAdminMenuRequestValidator : Validator<PutAdminMenuRequest>
{
    public PutAdminMenuRequestValidator()
    {
        RuleFor(request => request.Id).NotEmpty().MaximumLength(32);

        RuleFor(request => request.Name)
            .NotEmpty()
            .WithMessage("Der Name darf nicht leer sein, Chef.")
            .MaximumLength(64);

        RuleFor(request => request.DefaultPriceCents)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Der Preis darf nicht negativ sein, Chef.");

        RuleFor(request => request.Kind)
            .Must(kind => AdminMenuMapper.ParseKind(kind) is not null)
            .WithMessage("Die Art muss 'doener' oder 'pizza' sein, Chef.");

        RuleFor(request => request.MaterialIcon)
            .NotEmpty()
            .WithMessage("Das Icon darf nicht leer sein, Chef.")
            .MaximumLength(64);

        RuleFor(request => request.Note).MaximumLength(128);
    }
}

// Edits an existing menu item's editable fields (the id itself is immutable). 404 if no such item.
// Admin-only.
public sealed class PutAdminMenu : Endpoint<PutAdminMenuRequest, PutAdminMenuResponse>
{
    private readonly IMenuService menuService;

    public PutAdminMenu(IMenuService menuService)
    {
        this.menuService = menuService;
    }

    public override void Configure()
    {
        Put("/api/admin/menu/{Id}");
        Roles("Admin");
    }

    public override async Task HandleAsync(PutAdminMenuRequest req, CancellationToken ct)
    {
        var command = new UpdateMenuItemCommand(
            req.Id,
            req.Name,
            req.DefaultPriceCents,
            AdminMenuMapper.ParseKind(req.Kind)!.Value,
            req.MaterialIcon,
            req.Note,
            req.IsInsider,
            req.SortOrder,
            req.IsAvailable
        );

        var result = await menuService.UpdateAsync(command, ct);
        if (!result.IsSuccess)
        {
            if (result.Error is { } message)
                AddError(message);

            await SendFailureAsync(result.Status, ct);
            return;
        }

        await Send.OkAsync(
            new PutAdminMenuResponse(AdminMenuMapper.ToDto(result.Value)),
            cancellation: ct
        );
    }

    private async Task SendFailureAsync(ResultStatus status, CancellationToken ct)
    {
        switch (status)
        {
            case ResultStatus.NotFound:
                await Send.NotFoundAsync(ct);
                break;
            default:
                await Send.ErrorsAsync(cancellation: ct);
                break;
        }
    }
}
