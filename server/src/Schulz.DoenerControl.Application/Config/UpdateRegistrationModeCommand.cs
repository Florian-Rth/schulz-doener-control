using Schulz.DoenerControl.Core.Enums;

namespace Schulz.DoenerControl.Application.Config;

// Admin update of the self-registration policy. SecretKey is required (non-blank) when Mode is
// SecretKeyOnly and ignored otherwise; the service validates and persists it onto the singleton row.
public sealed record UpdateRegistrationModeCommand(RegistrationModeType Mode, string? SecretKey);
