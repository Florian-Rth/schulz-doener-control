using FastEndpoints;
using FluentValidation;
using Schulz.DoenerControl.Application.Menu;
using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Api.Endpoints.Admin.Menu;

public sealed record PostAdminMenuRequest(
    string? Id,
    string Name,
    int DefaultPriceCents,
    string Kind,
    string MaterialIcon,
    string? Note,
    bool IsInsider,
    int SortOrder,
    bool IsAvailable
);

public sealed record PostAdminMenuResponse(AdminMenuItemDto Item);

public sealed class PostAdminMenuRequestValidator : Validator<PostAdminMenuRequest>
{
    public PostAdminMenuRequestValidator()
    {
        When(
            request => request.Id is not null,
            () =>
                RuleFor(request => request.Id)
                    .MaximumLength(32)
                    .Must(id => id!.Trim().Length > 0)
                    .WithMessage("Die ID darf nicht leer sein, Chef.")
        );

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

// Creates a new menu item. Id is optional (the service slugifies the name when omitted). A duplicate
// id is a 409. Admin-only.
public sealed class PostAdminMenu : Endpoint<PostAdminMenuRequest, PostAdminMenuResponse>
{
    private readonly IMenuService menuService;

    public PostAdminMenu(IMenuService menuService)
    {
        this.menuService = menuService;
    }

    public override void Configure()
    {
        Post("/api/admin/menu");
        Roles("Admin");
    }

    public override async Task HandleAsync(PostAdminMenuRequest req, CancellationToken ct)
    {
        var command = new CreateMenuItemCommand(
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

        var result = await menuService.CreateAsync(command, ct);
        if (!result.IsSuccess)
        {
            if (result.Error is { } message)
                AddError(message);

            await SendFailureAsync(result.Status, ct);
            return;
        }

        await Send.CreatedAtAsync<GetAdminMenu>(
            routeValues: null,
            responseBody: new PostAdminMenuResponse(AdminMenuMapper.ToDto(result.Value)),
            generateAbsoluteUrl: false,
            cancellation: ct
        );
    }

    private async Task SendFailureAsync(ResultStatus status, CancellationToken ct)
    {
        switch (status)
        {
            case ResultStatus.Conflict:
                await Send.ErrorsAsync(StatusCodes.Status409Conflict, cancellation: ct);
                break;
            default:
                await Send.ErrorsAsync(cancellation: ct);
                break;
        }
    }
}
