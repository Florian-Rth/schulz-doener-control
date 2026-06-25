using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Schulz.DoenerControl.Application.Config;
using Schulz.DoenerControl.Core;
using Schulz.DoenerControl.Core.Enums;
using Schulz.DoenerControl.Infrastructure.Persistence;

namespace Schulz.DoenerControl.Infrastructure.Config;

// Reads and updates the single RegistrationMode row that governs self-registration at runtime,
// mirroring NotificationTemplateService's DB-backed editable shape. The migration seeds exactly one
// row; if it is somehow missing (e.g. a hand-tampered DB) the read fails open to Enabled so the
// register flow is never accidentally locked out, and logs a warning so the gap is visible.
public sealed class RegistrationModeService : IRegistrationModeService
{
    private const string SecretKeyRequired =
        "Für den Modus „Nur mit Geheim-Schlüssel“ musst du einen Schlüssel angeben, Chef.";

    private readonly AppDbContext database;
    private readonly TimeProvider timeProvider;
    private readonly ILogger<RegistrationModeService> logger;

    public RegistrationModeService(
        AppDbContext database,
        TimeProvider timeProvider,
        ILogger<RegistrationModeService> logger
    )
    {
        this.database = database;
        this.timeProvider = timeProvider;
        this.logger = logger;
    }

    public async Task<RegistrationModeDetails> GetModeAsync(CancellationToken ct)
    {
        var row = await database.RegistrationMode.AsNoTracking().FirstOrDefaultAsync(ct);
        if (row is null)
        {
            logger.LogWarning(
                "No RegistrationMode row found; defaulting to Enabled. The seed migration should "
                    + "have planted exactly one row."
            );
            return new RegistrationModeDetails(RegistrationModeType.Enabled, null);
        }

        return MapDetails(row);
    }

    public async Task<Result<RegistrationModeDetails>> UpdateModeAsync(
        UpdateRegistrationModeCommand command,
        CancellationToken ct
    )
    {
        var normalizedKey = string.IsNullOrWhiteSpace(command.SecretKey)
            ? null
            : command.SecretKey.Trim();

        if (command.Mode == RegistrationModeType.SecretKeyOnly && normalizedKey is null)
        {
            return Result<RegistrationModeDetails>.Validation(SecretKeyRequired);
        }

        var row = await database.RegistrationMode.FirstOrDefaultAsync(ct);
        if (row is null)
        {
            // Self-heal a missing singleton rather than fail: create the one row the migration seeds.
            logger.LogWarning(
                "No RegistrationMode row found on update; creating the singleton row."
            );
            row = new Core.Entities.RegistrationMode { Id = Guid.NewGuid() };
            database.RegistrationMode.Add(row);
        }

        // The secret key only makes sense in SecretKeyOnly mode; clear it otherwise so a stale key
        // never lingers behind an Enabled/Disabled policy.
        row.Mode = (int)command.Mode;
        row.SecretKey = command.Mode == RegistrationModeType.SecretKeyOnly ? normalizedKey : null;
        row.UpdatedAt = timeProvider.GetUtcNow().UtcDateTime;

        await database.SaveChangesAsync(ct);

        return Result<RegistrationModeDetails>.Success(MapDetails(row));
    }

    private static RegistrationModeDetails MapDetails(Core.Entities.RegistrationMode row) =>
        new((RegistrationModeType)row.Mode, row.SecretKey);
}
