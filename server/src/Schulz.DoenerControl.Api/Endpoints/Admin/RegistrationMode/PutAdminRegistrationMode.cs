using FastEndpoints;
using FluentValidation;
using Schulz.DoenerControl.Application.Config;
using Schulz.DoenerControl.Core;
using Schulz.DoenerControl.Core.Enums;

namespace Schulz.DoenerControl.Api.Endpoints.Admin.RegistrationMode;

// mode is the chosen policy (1 Enabled / 2 Disabled / 3 SecretKeyOnly); secretKey is only required
// when mode is SecretKeyOnly. The validator enforces the range and the cross-field requirement.
public sealed class PutAdminRegistrationModeRequest
{
    public int Mode { get; set; }

    public string? SecretKey { get; set; }
}

public sealed class PutAdminRegistrationModeRequestValidator
    : Validator<PutAdminRegistrationModeRequest>
{
    public PutAdminRegistrationModeRequestValidator()
    {
        RuleFor(request => request.Mode)
            .InclusiveBetween(1, 3)
            .WithMessage("Ungültiger Registrierungsmodus, Chef.");

        When(
            request => request.Mode == (int)RegistrationModeType.SecretKeyOnly,
            () =>
                RuleFor(request => request.SecretKey)
                    .NotEmpty()
                    .WithMessage(
                        "Für den Modus „Nur mit Geheim-Schlüssel“ musst du einen Schlüssel angeben, Chef."
                    )
                    .MaximumLength(128)
        );

        When(
            request => request.Mode != (int)RegistrationModeType.SecretKeyOnly,
            () => RuleFor(request => request.SecretKey).MaximumLength(128)
        );
    }
}

// Updates the self-registration policy on the singleton row. Admin-only.
public sealed class PutAdminRegistrationMode
    : Endpoint<PutAdminRegistrationModeRequest, AdminRegistrationModeDto>
{
    private readonly IRegistrationModeService registrationModeService;

    public PutAdminRegistrationMode(IRegistrationModeService registrationModeService)
    {
        this.registrationModeService = registrationModeService;
    }

    public override void Configure()
    {
        Put("/api/admin/registration-mode");
        Roles("Admin");
    }

    public override async Task HandleAsync(
        PutAdminRegistrationModeRequest req,
        CancellationToken ct
    )
    {
        var command = new UpdateRegistrationModeCommand(
            (RegistrationModeType)req.Mode,
            req.SecretKey
        );

        var result = await registrationModeService.UpdateModeAsync(command, ct);
        if (!result.IsSuccess)
        {
            if (result.Error is { } message)
                AddError(message);

            await Send.ErrorsAsync(cancellation: ct);
            return;
        }

        await Send.OkAsync(AdminRegistrationModeMapper.ToDto(result.Value), cancellation: ct);
    }
}
