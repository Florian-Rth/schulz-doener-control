namespace Schulz.DoenerControl.Core.Entities;

// An in-app / push notification record addressed to a single recipient. The push text is
// rendered from a template; this row persists what was sent so it survives a refresh.
public sealed class Notification
{
    public Guid Id { get; set; }

    public Guid RecipientUserId { get; set; }

    public required string Title { get; set; }

    public required string Body { get; set; }

    // Optional link back to the OrderDay that triggered it (e.g. day-opened pushes).
    public Guid? OrderDayId { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset? ReadAt { get; set; }

    public User? RecipientUser { get; set; }

    public OrderDay? OrderDay { get; set; }
}
