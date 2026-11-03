using System.Diagnostics.Contracts;
using Microsoft.EntityFrameworkCore;
using Schulz.DoenerControl.Application.Fields;
using Schulz.DoenerControl.Core;
using Schulz.DoenerControl.Core.Entities;
using Schulz.DoenerControl.Core.Enums;
using Schulz.DoenerControl.Infrastructure.Persistence;

namespace Schulz.DoenerControl.Infrastructure.Fields;

// Admin CRUD for the reusable field library + its options, scoped to the single active store. A
// field's Key and Type are immutable once created (only Label/Display/MaxLength are editable), and an
// option's Key is immutable. The reserved meat/sauce fields and their kalb/haehnchen/gemischt and
// kraeuter/knoblauch/scharf options can never be DELETED (the Tier contract depends on them) though
// they stay relabellable/repriceable/retirable. A field referenced by any category link can't be
// hard-deleted. Options are soft-retired (IsAvailable=false) on delete so historical OrderLine.Answers
// still resolve their labels — mirroring the MenuService soft-retire precedent for referenced rows.
public sealed class FieldService : IFieldService
{
    private static readonly IReadOnlySet<string> ReservedFieldKeys = new HashSet<string>(
        StringComparer.Ordinal
    )
    {
        "meat",
        "sauce",
    };

    private static readonly IReadOnlyDictionary<string, IReadOnlySet<string>> ReservedOptionKeys =
        new Dictionary<string, IReadOnlySet<string>>(StringComparer.Ordinal)
        {
            ["meat"] = new HashSet<string>(StringComparer.Ordinal)
            {
                "kalb",
                "haehnchen",
                "gemischt",
            },
            ["sauce"] = new HashSet<string>(StringComparer.Ordinal)
            {
                "kraeuter",
                "knoblauch",
                "scharf",
            },
        };

    private readonly AppDbContext database;

    public FieldService(AppDbContext database)
    {
        this.database = database;
    }

    public async Task<Result<IReadOnlyList<FieldDetails>>> ListAllAsync(CancellationToken ct)
    {
        var storeId = await ActiveStoreIdAsync(ct);

        var fields = await database
            .FieldDefinitions.AsNoTracking()
            .Where(field => field.StoreId == storeId)
            .Include(field => field.Options)
            .OrderBy(field => field.Key)
            .ToListAsync(ct);

        IReadOnlyList<FieldDetails> details = fields.Select(MapDetails).ToList();
        return Result<IReadOnlyList<FieldDetails>>.Success(details);
    }

    public async Task<Result<FieldDetails>> CreateAsync(
        CreateFieldCommand command,
        CancellationToken ct
    )
    {
        var storeId = await ActiveStoreIdAsync(ct);
        if (storeId is null)
            return Result<FieldDetails>.Validation("Kein aktiver Laden vorhanden, Chef.");

        var type = ParseType(command.Type);
        if (type is null)
            return Result<FieldDetails>.Validation($"Unbekannter Feldtyp '{command.Type}', Chef.");

        var display = ParseDisplay(command.Display);
        if (display is null)
        {
            return Result<FieldDetails>.Validation(
                $"Unbekannte Darstellung '{command.Display}', Chef."
            );
        }

        var key = command.Key.Trim();
        if (await database.FieldDefinitions.AnyAsync(f => f.StoreId == storeId && f.Key == key, ct))
        {
            return Result<FieldDetails>.Conflict(
                $"Ein Feld mit dem Schlüssel '{key}' existiert bereits, Chef."
            );
        }

        var field = new FieldDefinition
        {
            Id = Guid.NewGuid(),
            StoreId = storeId.Value,
            Key = key,
            Label = command.Label.Trim(),
            Type = type.Value,
            Display = display.Value,
            MaxLength = command.MaxLength,
            Options = [],
        };
        database.FieldDefinitions.Add(field);
        await database.SaveChangesAsync(ct);

        return Result<FieldDetails>.Success(MapDetails(field));
    }

    public async Task<Result<FieldDetails>> UpdateAsync(
        UpdateFieldCommand command,
        CancellationToken ct
    )
    {
        var storeId = await ActiveStoreIdAsync(ct);
        var field = await FindWithOptionsAsync(command.Key.Trim(), storeId, ct);
        if (field is null)
            return Result<FieldDetails>.NotFound(FieldNotFoundMessage(command.Key));

        var display = ParseDisplay(command.Display);
        if (display is null)
        {
            return Result<FieldDetails>.Validation(
                $"Unbekannte Darstellung '{command.Display}', Chef."
            );
        }

        // Key and Type are immutable — only presentation and text bounds change here.
        field.Label = command.Label.Trim();
        field.Display = display.Value;
        field.MaxLength = command.MaxLength;
        await database.SaveChangesAsync(ct);

        return Result<FieldDetails>.Success(MapDetails(field));
    }

    public async Task<Result> DeleteAsync(string key, CancellationToken ct)
    {
        var storeId = await ActiveStoreIdAsync(ct);
        var trimmedKey = key.Trim();

        if (ReservedFieldKeys.Contains(trimmedKey))
        {
            return Result.Validation(
                $"Das Feld '{trimmedKey}' ist reserviert und kann nicht gelöscht werden, Chef."
            );
        }

        var field = await database.FieldDefinitions.FirstOrDefaultAsync(
            f => f.StoreId == storeId && f.Key == trimmedKey,
            ct
        );
        if (field is null)
            return Result.NotFound(FieldNotFoundMessage(key));

        // A field exposed on any category is a FK the link froze onto; hard-deleting it would orphan
        // that link, so the deletion is rejected until the category drops it via SetFields.
        var isReferenced = await database.CategoryFields.AnyAsync(
            link => link.FieldDefinitionId == field.Id,
            ct
        );
        if (isReferenced)
        {
            return Result.Conflict(
                $"Das Feld '{trimmedKey}' wird von einer Kategorie genutzt und kann nicht gelöscht "
                    + "werden, Chef."
            );
        }

        // Its options cascade-delete with the field.
        database.FieldDefinitions.Remove(field);
        await database.SaveChangesAsync(ct);
        return Result.Success();
    }

    public async Task<Result<FieldDetails>> AddOptionAsync(
        AddFieldOptionCommand command,
        CancellationToken ct
    )
    {
        var storeId = await ActiveStoreIdAsync(ct);
        var field = await FindWithOptionsAsync(command.FieldKey.Trim(), storeId, ct);
        if (field is null)
            return Result<FieldDetails>.NotFound(FieldNotFoundMessage(command.FieldKey));

        var optionKey = command.Key.Trim();
        if ((field.Options ?? []).Any(option => option.Key == optionKey))
        {
            return Result<FieldDetails>.Conflict(
                $"Eine Option mit dem Schlüssel '{optionKey}' existiert bereits, Chef."
            );
        }

        var option = new FieldOption
        {
            Id = Guid.NewGuid(),
            FieldDefinitionId = field.Id,
            Key = optionKey,
            Label = command.Label.Trim(),
            Icon = NormalizeOptional(command.Icon),
            PriceDeltaCents = command.PriceDeltaCents,
            SortOrder = command.SortOrder,
            IsAvailable = command.IsAvailable,
        };
        database.FieldOptions.Add(option);
        await database.SaveChangesAsync(ct);

        var reloaded = await FindWithOptionsAsync(field.Key, storeId, ct);
        return Result<FieldDetails>.Success(MapDetails(reloaded!));
    }

    public async Task<Result<FieldDetails>> UpdateOptionAsync(
        UpdateFieldOptionCommand command,
        CancellationToken ct
    )
    {
        var storeId = await ActiveStoreIdAsync(ct);
        var field = await FindWithOptionsAsync(command.FieldKey.Trim(), storeId, ct);
        if (field is null)
            return Result<FieldDetails>.NotFound(FieldNotFoundMessage(command.FieldKey));

        var optionKey = command.OptionKey.Trim();
        var option = (field.Options ?? []).FirstOrDefault(o => o.Key == optionKey);
        if (option is null)
            return Result<FieldDetails>.NotFound(OptionNotFoundMessage(command.OptionKey));

        // Option key is immutable; everything else (incl. availability, even for reserved options) is
        // editable.
        option.Label = command.Label.Trim();
        option.Icon = NormalizeOptional(command.Icon);
        option.PriceDeltaCents = command.PriceDeltaCents;
        option.SortOrder = command.SortOrder;
        option.IsAvailable = command.IsAvailable;
        await database.SaveChangesAsync(ct);

        return Result<FieldDetails>.Success(MapDetails(field));
    }

    public async Task<Result> DeleteOptionAsync(
        string fieldKey,
        string optionKey,
        CancellationToken ct
    )
    {
        var storeId = await ActiveStoreIdAsync(ct);
        var trimmedFieldKey = fieldKey.Trim();
        var trimmedOptionKey = optionKey.Trim();

        if (IsReservedOption(trimmedFieldKey, trimmedOptionKey))
        {
            return Result.Validation(
                $"Die Option '{trimmedOptionKey}' ist reserviert und kann nicht gelöscht werden, "
                    + "Chef."
            );
        }

        var field = await FindWithOptionsAsync(trimmedFieldKey, storeId, ct);
        if (field is null)
            return Result.NotFound(FieldNotFoundMessage(fieldKey));

        var option = (field.Options ?? []).FirstOrDefault(o => o.Key == trimmedOptionKey);
        if (option is null)
            return Result.NotFound(OptionNotFoundMessage(optionKey));

        // An option may be frozen into past orders' JSON answers, which is too expensive to probe, so
        // it is soft-retired (IsAvailable=false) rather than hard-deleted — the label still resolves
        // for history, and the option simply drops off the public order form.
        option.IsAvailable = false;
        await database.SaveChangesAsync(ct);
        return Result.Success();
    }

    private async Task<FieldDefinition?> FindWithOptionsAsync(
        string key,
        Guid? storeId,
        CancellationToken ct
    ) =>
        await database
            .FieldDefinitions.Where(field => field.StoreId == storeId && field.Key == key)
            .Include(field => field.Options)
            .FirstOrDefaultAsync(ct);

    private async Task<Guid?> ActiveStoreIdAsync(CancellationToken ct) =>
        await database
            .Stores.AsNoTracking()
            .Where(store => store.IsActive)
            .OrderBy(store => store.SortOrder)
            .Select(store => (Guid?)store.Id)
            .FirstOrDefaultAsync(ct);

    [Pure]
    private static bool IsReservedOption(string fieldKey, string optionKey) =>
        ReservedOptionKeys.TryGetValue(fieldKey, out var keys) && keys.Contains(optionKey);

    private static string FieldNotFoundMessage(string key) =>
        $"Kein Feld mit dem Schlüssel '{key}', Chef.";

    private static string OptionNotFoundMessage(string key) =>
        $"Keine Option mit dem Schlüssel '{key}', Chef.";

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static FieldDetails MapDetails(FieldDefinition field) =>
        new(
            field.Key,
            field.Label,
            TypeToken(field.Type),
            DisplayToken(field.Display),
            field.MaxLength,
            (field.Options ?? [])
                .OrderBy(option => option.SortOrder)
                .Select(option => new FieldOptionDetails(
                    option.Key,
                    option.Label,
                    option.Icon,
                    option.PriceDeltaCents,
                    option.SortOrder,
                    option.IsAvailable
                ))
                .ToList()
        );

    [Pure]
    private static FieldType? ParseType(string type) =>
        type switch
        {
            "single" => FieldType.SingleSelect,
            "multi" => FieldType.MultiSelect,
            "text" => FieldType.Text,
            _ => null,
        };

    [Pure]
    private static FieldDisplay? ParseDisplay(string display) =>
        display switch
        {
            "segmented" => FieldDisplay.Segmented,
            "chips" => FieldDisplay.Chips,
            "dropdown" => FieldDisplay.Dropdown,
            "textarea" => FieldDisplay.Textarea,
            _ => null,
        };

    [Pure]
    private static string TypeToken(FieldType type) =>
        type switch
        {
            FieldType.SingleSelect => "single",
            FieldType.MultiSelect => "multi",
            FieldType.Text => "text",
            _ => throw new ArgumentOutOfRangeException(nameof(type), type, null),
        };

    [Pure]
    private static string DisplayToken(FieldDisplay display) =>
        display switch
        {
            FieldDisplay.Segmented => "segmented",
            FieldDisplay.Chips => "chips",
            FieldDisplay.Dropdown => "dropdown",
            FieldDisplay.Textarea => "textarea",
            _ => throw new ArgumentOutOfRangeException(nameof(display), display, null),
        };
}
