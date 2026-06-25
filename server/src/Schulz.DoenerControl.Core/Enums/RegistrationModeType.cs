namespace Schulz.DoenerControl.Core.Enums;

// The self-registration policy, persisted as the single RegistrationMode row's Mode column.
//  Enabled       — anyone may register (the product default).
//  Disabled      — registration is closed; the anonymous register endpoint is forbidden.
//  SecretKeyOnly — registration requires the shared secret key (carried in the QR-code URL).
public enum RegistrationModeType
{
    Enabled = 1,
    Disabled = 2,
    SecretKeyOnly = 3,
}
