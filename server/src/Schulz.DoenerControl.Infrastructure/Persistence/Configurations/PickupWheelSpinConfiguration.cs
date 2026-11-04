using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Schulz.DoenerControl.Core.Entities;

namespace Schulz.DoenerControl.Infrastructure.Persistence.Configurations;

public sealed class PickupWheelSpinConfiguration : IEntityTypeConfiguration<PickupWheelSpin>
{
    public void Configure(EntityTypeBuilder<PickupWheelSpin> builder)
    {
        builder.ToTable("PickupWheelSpins");
        builder.HasKey(spin => spin.Id);

        // One spin per round and day: two app instances (or the worker racing a re-spin) can never
        // both land the same round.
        builder.HasIndex(spin => new { spin.OrderDayId, spin.Round }).IsUnique();

        builder
            .HasOne(spin => spin.OrderDay)
            .WithMany()
            .HasForeignKey(spin => spin.OrderDayId)
            .OnDelete(DeleteBehavior.Cascade);

        builder
            .HasOne(spin => spin.ChosenUser)
            .WithMany()
            .HasForeignKey(spin => spin.ChosenUserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
