using Microsoft.EntityFrameworkCore;
using Schulz.DoenerControl.Application.Notifications;
using Schulz.DoenerControl.Core;
using Schulz.DoenerControl.Core.Entities;
using Schulz.DoenerControl.Infrastructure.Persistence;

namespace Schulz.DoenerControl.Infrastructure.Notifications;

public sealed class NotificationTemplateService : INotificationTemplateService
{
    private readonly AppDbContext database;

    public NotificationTemplateService(AppDbContext database)
    {
        this.database = database;
    }

    public async Task<Result<IReadOnlyList<NotificationTemplateDetails>>> ListAllAsync(
        CancellationToken ct
    )
    {
        var templates = await database
            .NotificationTemplates.AsNoTracking()
            .OrderBy(template => template.Synonym)
            .ToListAsync(ct);

        IReadOnlyList<NotificationTemplateDetails> details = templates.Select(MapDetails).ToList();
        return Result<IReadOnlyList<NotificationTemplateDetails>>.Success(details);
    }

    public async Task<Result<NotificationTemplateDetails>> CreateAsync(
        CreateNotificationTemplateCommand command,
        CancellationToken ct
    )
    {
        var template = new NotificationTemplate
        {
            Id = Guid.NewGuid(),
            Synonym = command.Synonym.Trim(),
            Body = command.Body.Trim(),
            IsActive = command.IsActive,
        };

        database.NotificationTemplates.Add(template);
        await database.SaveChangesAsync(ct);

        return Result<NotificationTemplateDetails>.Success(MapDetails(template));
    }

    public async Task<Result<NotificationTemplateDetails>> UpdateAsync(
        UpdateNotificationTemplateCommand command,
        CancellationToken ct
    )
    {
        var template = await database.NotificationTemplates.FirstOrDefaultAsync(
            row => row.Id == command.Id,
            ct
        );
        if (template is null)
        {
            return Result<NotificationTemplateDetails>.NotFound(
                "Diesen Benachrichtigungstext gibt es nicht (mehr), Chef."
            );
        }

        template.Synonym = command.Synonym.Trim();
        template.Body = command.Body.Trim();
        template.IsActive = command.IsActive;

        await database.SaveChangesAsync(ct);

        return Result<NotificationTemplateDetails>.Success(MapDetails(template));
    }

    public async Task<Result> DeleteAsync(Guid id, CancellationToken ct)
    {
        var template = await database.NotificationTemplates.FirstOrDefaultAsync(
            row => row.Id == id,
            ct
        );
        if (template is null)
        {
            return Result.NotFound("Diesen Benachrichtigungstext gibt es nicht (mehr), Chef.");
        }

        database.NotificationTemplates.Remove(template);
        await database.SaveChangesAsync(ct);
        return Result.Success();
    }

    private static NotificationTemplateDetails MapDetails(NotificationTemplate template) =>
        new(template.Id, template.Synonym, template.Body, template.IsActive);
}
