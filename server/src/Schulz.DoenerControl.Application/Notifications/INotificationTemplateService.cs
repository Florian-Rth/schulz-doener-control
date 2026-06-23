using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Application.Notifications;

public interface INotificationTemplateService
{
    // Admin management: every open-day notification text, including disabled ones.
    Task<Result<IReadOnlyList<NotificationTemplateDetails>>> ListAllAsync(CancellationToken ct);

    Task<Result<NotificationTemplateDetails>> CreateAsync(
        CreateNotificationTemplateCommand command,
        CancellationToken ct
    );

    Task<Result<NotificationTemplateDetails>> UpdateAsync(
        UpdateNotificationTemplateCommand command,
        CancellationToken ct
    );

    Task<Result> DeleteAsync(Guid id, CancellationToken ct);
}
