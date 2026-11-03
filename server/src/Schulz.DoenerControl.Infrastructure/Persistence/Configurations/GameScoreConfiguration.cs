using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Schulz.DoenerControl.Core.Entities;

namespace Schulz.DoenerControl.Infrastructure.Persistence.Configurations;

public sealed class GameScoreConfiguration : IEntityTypeConfiguration<GameScore>
{
    public void Configure(EntityTypeBuilder<GameScore> builder)
    {
        builder.ToTable("GameScores");
        builder.HasKey(score => score.Id);

        // Both leaderboard reads rank by score, one of them per Döner-Tag.
        builder.HasIndex(score => new { score.OrderDayId, score.Score });
        builder.HasIndex(score => score.Score);

        builder
            .HasOne(score => score.User)
            .WithMany()
            .HasForeignKey(score => score.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // A score outlives its Döner-Tag: it still counts towards the all-time list.
        builder
            .HasOne(score => score.OrderDay)
            .WithMany()
            .HasForeignKey(score => score.OrderDayId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
