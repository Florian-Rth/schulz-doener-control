namespace Schulz.DoenerControl.Core.Entities;

// One finished round of the Döner-Weitwurf waiting game. Client-reported, so the numbers are
// range-checked on submit (GameScoreRules). Tied to the Döner-Tag it was played on when there was
// one today, so the leaderboard can show "heute" next to the all-time best.
public sealed class GameScore
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public Guid? OrderDayId { get; set; }

    public int Score { get; set; }

    public int Hits { get; set; }

    public int Misses { get; set; }

    public DateTimeOffset PlayedAt { get; set; }

    public User? User { get; set; }

    public OrderDay? OrderDay { get; set; }
}
