namespace Schulz.DoenerControl.Core.Entities;

// The single-row singleton that governs public self-registration at runtime. Modelled after the
// DB-backed NotificationTemplate so an admin can flip the policy without a redeploy. There is exactly
// one row; the service reads and updates it in place.
public sealed class RegistrationMode
{
    public Guid Id { get; set; }

    // The active policy. Stored as the int backing of RegistrationModeType so the column is a plain
    // 1/2/3 the SPA and admin API can round-trip.
    public int Mode { get; set; }

    // The shared secret required when Mode is SecretKeyOnly. Null/blank in the other modes.
    public string? SecretKey { get; set; }

    public DateTime UpdatedAt { get; set; }
}
