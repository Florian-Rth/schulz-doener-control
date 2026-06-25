using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Application.Config;

// Runtime-editable self-registration policy backed by the single RegistrationMode row. Mirrors how
// INotificationTemplateService exposes DB-backed editable config to the Api layer without leaking
// EF entities across the service boundary.
public interface IRegistrationModeService
{
    Task<RegistrationModeDetails> GetModeAsync(CancellationToken ct);

    Task<Result<RegistrationModeDetails>> UpdateModeAsync(
        UpdateRegistrationModeCommand command,
        CancellationToken ct
    );
}
