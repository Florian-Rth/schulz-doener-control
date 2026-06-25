using Schulz.DoenerControl.Core.Enums;

namespace Schulz.DoenerControl.Application.Config;

// The current self-registration policy and its configured secret key. SecretKey is null unless the
// mode is SecretKeyOnly with a key set; it never crosses into the anonymous client-config response.
public sealed record RegistrationModeDetails(RegistrationModeType Mode, string? SecretKey);
