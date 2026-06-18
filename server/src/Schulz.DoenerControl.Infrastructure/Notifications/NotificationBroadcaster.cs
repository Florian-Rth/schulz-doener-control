using Microsoft.EntityFrameworkCore;
using Schulz.DoenerControl.Application.Notifications;
using Schulz.DoenerControl.Core.Entities;
using Schulz.DoenerControl.Infrastructure.Persistence;

namespace Schulz.DoenerControl.Infrastructure.Notifications;

// Inserts one Notification row per OTHER active user when a day opens. Shares the OrderDay service's
// DbContext (scoped) so the rows land in the same SaveChanges as the OrderDay insert.
public sealed class NotificationBroadcaster : INotificationBroadcaster
{
    private readonly AppDbContext database;
    private readonly TimeProvider timeProvider;

    public NotificationBroadcaster(AppDbContext database, TimeProvider timeProvider)
    {
        this.database = database;
        this.timeProvider = timeProvider;
    }

    public async Task<int> BroadcastDayOpenedAsync(
        Guid orderDayId,
        string title,
        string body,
        Guid openerUserId,
        CancellationToken ct
    )
    {
        var recipientIds = await database
            .Users.Where(user => user.IsActive && user.Id != openerUserId)
            .Select(user => user.Id)
            .ToListAsync(ct);

        var createdAt = timeProvider.GetUtcNow();
        foreach (var recipientId in recipientIds)
        {
            database.Notifications.Add(
                new Notification
                {
                    Id = Guid.NewGuid(),
                    RecipientUserId = recipientId,
                    Title = title,
                    Body = body,
                    OrderDayId = orderDayId,
                    CreatedAt = createdAt,
                    ReadAt = null,
                }
            );
        }

        return recipientIds.Count;
    }
}
